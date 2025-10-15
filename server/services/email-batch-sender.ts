/**
 * Automated Batch Email Sender
 * Handles rate limiting, warm-up, and deliverability optimization
 */

import { createTransporter } from '../email-transporter.js';

interface BatchConfig {
  batchSize: number;
  delayBetweenBatches: number; // milliseconds
  maxDailyLimit?: number;
  warmupMode: boolean;
}

interface SendResult {
  success: boolean;
  sent: number;
  failed: number;
  bounced: number;
  errors: Array<{ email: string; error: string }>;
  duration: number;
}

interface WarmupSchedule {
  day: number;
  maxEmails: number;
  batchSize: number;
  delayMs: number;
}

export class BatchEmailSender {
  private transporter: any;
  private dailySentCount: number = 0;
  private lastResetDate: string = '';

  // Warm-up schedule (gradual increase)
  private warmupSchedule: WarmupSchedule[] = [
    { day: 1, maxEmails: 50, batchSize: 10, delayMs: 10000 },   // Day 1: 50 emails, 10/batch, 10s delay
    { day: 2, maxEmails: 100, batchSize: 20, delayMs: 8000 },   // Day 2: 100 emails
    { day: 3, maxEmails: 200, batchSize: 50, delayMs: 8000 },   // Day 3: 200 emails
    { day: 4, maxEmails: 500, batchSize: 50, delayMs: 6000 },   // Day 4-7: 500 emails
    { day: 8, maxEmails: 1000, batchSize: 100, delayMs: 5000 }, // Day 8-14: 1,000 emails
    { day: 15, maxEmails: 5000, batchSize: 100, delayMs: 5000 },// Day 15-30: 5,000 emails
    { day: 31, maxEmails: 50000, batchSize: 100, delayMs: 5000 }// Day 31+: Full volume
  ];

  constructor() {
    this.initializeTransporter();
    this.resetDailyCount();
  }

  private async initializeTransporter() {
    this.transporter = await createTransporter();
  }

  /**
   * Reset daily sent count if it's a new day
   */
  private resetDailyCount() {
    const today = new Date().toISOString().split('T')[0];
    if (this.lastResetDate !== today) {
      this.dailySentCount = 0;
      this.lastResetDate = today;
      console.log(`[Batch Sender] Daily count reset for ${today}`);
    }
  }

  /**
   * Get warm-up configuration based on domain age (days since first send)
   */
  getWarmupConfig(daysSinceStart: number): WarmupSchedule {
    // Find the appropriate schedule
    const schedule = [...this.warmupSchedule]
      .reverse()
      .find(s => daysSinceStart >= s.day) || this.warmupSchedule[0];
    
    console.log(`[Batch Sender] Day ${daysSinceStart} warm-up: max ${schedule.maxEmails} emails`);
    return schedule;
  }

  /**
   * Send emails in batches with rate limiting
   */
  async sendBatch(
    emails: Array<{
      to: string;
      from: string;
      subject: string;
      html: string;
      text: string;
    }>,
    config?: Partial<BatchConfig>
  ): Promise<SendResult> {
    const startTime = Date.now();
    this.resetDailyCount();

    // Default configuration
    const batchConfig: BatchConfig = {
      batchSize: config?.batchSize || 100,
      delayBetweenBatches: config?.delayBetweenBatches || 5000,
      maxDailyLimit: config?.maxDailyLimit,
      warmupMode: config?.warmupMode || false
    };

    const result: SendResult = {
      success: true,
      sent: 0,
      failed: 0,
      bounced: 0,
      errors: [],
      duration: 0
    };

    // Check daily limit
    if (batchConfig.maxDailyLimit && this.dailySentCount >= batchConfig.maxDailyLimit) {
      console.warn(`[Batch Sender] Daily limit reached: ${this.dailySentCount}/${batchConfig.maxDailyLimit}`);
      result.success = false;
      return result;
    }

    console.log(`[Batch Sender] Starting batch send: ${emails.length} emails, ${batchConfig.batchSize} per batch`);

    // Process in batches
    for (let i = 0; i < emails.length; i += batchConfig.batchSize) {
      const batch = emails.slice(i, i + batchConfig.batchSize);
      
      console.log(`[Batch Sender] Processing batch ${Math.floor(i / batchConfig.batchSize) + 1}: ${batch.length} emails`);

      // Send batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map(async (email) => {
          try {
            if (!this.transporter) {
              await this.initializeTransporter();
            }

            await this.transporter.sendMail({
              from: email.from,
              to: email.to,
              subject: email.subject,
              html: email.html,
              text: email.text
            });

            this.dailySentCount++;
            return { success: true, email: email.to };
          } catch (error: any) {
            // Detect bounce types
            const isBounce = error.responseCode >= 500 || 
                           error.message?.includes('bounce') ||
                           error.message?.includes('not exist');
            
            if (isBounce) {
              result.bounced++;
            }
            
            return { 
              success: false, 
              email: email.to, 
              error: error.message,
              isBounce 
            };
          }
        })
      );

      // Process results
      batchResults.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value.success) {
          result.sent++;
        } else {
          result.failed++;
          const error = res.status === 'rejected' 
            ? res.reason?.message || 'Unknown error'
            : (res.value as any).error;
          
          result.errors.push({
            email: batch[idx].to,
            error
          });
        }
      });

      // Delay between batches (except for last batch)
      if (i + batchConfig.batchSize < emails.length) {
        console.log(`[Batch Sender] Waiting ${batchConfig.delayBetweenBatches}ms before next batch...`);
        await this.delay(batchConfig.delayBetweenBatches);
      }

      // Check if we hit daily limit
      if (batchConfig.maxDailyLimit && this.dailySentCount >= batchConfig.maxDailyLimit) {
        console.warn(`[Batch Sender] Daily limit reached mid-send: ${this.dailySentCount}/${batchConfig.maxDailyLimit}`);
        break;
      }
    }

    result.duration = Date.now() - startTime;
    
    console.log(`[Batch Sender] Batch complete: ${result.sent} sent, ${result.failed} failed, ${result.bounced} bounced (${result.duration}ms)`);
    
    return result;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current daily stats
   */
  getDailyStats() {
    return {
      date: this.lastResetDate,
      sent: this.dailySentCount
    };
  }
}

export const batchEmailSender = new BatchEmailSender();
