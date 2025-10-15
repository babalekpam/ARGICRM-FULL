/**
 * Automated Spam Content Checker
 * Analyzes email content for spam triggers before sending
 */

interface SpamCheckResult {
  isSpammy: boolean;
  score: number; // 0-100 (higher = more spammy)
  risk: 'low' | 'medium' | 'high';
  triggers: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  suggestions: string[];
}

export class SpamChecker {
  // Spam trigger words (weighted by severity)
  private spamWords = {
    high: [
      'free', 'winner', 'click here', 'act now', 'limited time', 'urgent',
      'congratulations', 'you\'ve won', 'claim now', 'no cost', 'guarantee',
      '100% free', 'risk-free', 'cancel anytime', 'as seen on', 'bargain',
      'cash bonus', 'earn money', 'extra income', 'work from home'
    ],
    medium: [
      'buy now', 'order now', 'discount', 'offer', 'save', 'deal',
      'special promotion', 'limited offer', 'act immediately', 'call now',
      'don\'t delete', 'don\'t hesitate', 'exclusive deal', 'get it now'
    ],
    low: [
      'bonus', 'sale', 'prize', 'lowest price', 'best price', 'cheap',
      'affordable', 'compare', 'shopping'
    ]
  };

  /**
   * Check email content for spam triggers
   */
  checkContent(subject: string, body: string, html?: string): SpamCheckResult {
    const result: SpamCheckResult = {
      isSpammy: false,
      score: 0,
      risk: 'low',
      triggers: [],
      suggestions: []
    };

    const fullText = `${subject} ${body}`.toLowerCase();

    // 1. Check for spam words
    let spamWordCount = 0;
    Object.entries(this.spamWords).forEach(([severity, words]) => {
      words.forEach(word => {
        if (fullText.includes(word.toLowerCase())) {
          const weight = severity === 'high' ? 15 : severity === 'medium' ? 8 : 3;
          result.score += weight;
          spamWordCount++;
          
          result.triggers.push({
            type: 'spam_word',
            description: `Contains spam trigger: "${word}"`,
            severity: severity as 'low' | 'medium' | 'high'
          });
        }
      });
    });

    if (spamWordCount > 0) {
      result.suggestions.push(`Remove spam trigger words (found ${spamWordCount})`);
    }

    // 2. Check for excessive punctuation
    const exclamationCount = (fullText.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      result.score += 10;
      result.triggers.push({
        type: 'excessive_punctuation',
        description: `Too many exclamation marks (${exclamationCount})`,
        severity: 'medium'
      });
      result.suggestions.push('Reduce exclamation marks to 1-2 maximum');
    }

    // 3. Check for ALL CAPS
    const capsWords = subject.match(/\b[A-Z]{4,}\b/g) || [];
    if (capsWords.length > 0) {
      result.score += 15;
      result.triggers.push({
        type: 'all_caps',
        description: `ALL CAPS words: ${capsWords.join(', ')}`,
        severity: 'high'
      });
      result.suggestions.push('Use normal capitalization instead of ALL CAPS');
    }

    // 4. Check for misleading subject lines
    if (subject.toLowerCase().startsWith('re:') || subject.toLowerCase().startsWith('fwd:')) {
      result.score += 20;
      result.triggers.push({
        type: 'misleading_subject',
        description: 'Subject line uses RE: or FWD: deceptively',
        severity: 'high'
      });
      result.suggestions.push('Remove misleading RE: or FWD: prefixes');
    }

    // 5. Check for excessive links
    if (html) {
      const linkCount = (html.match(/<a /g) || []).length;
      if (linkCount > 5) {
        result.score += 10;
        result.triggers.push({
          type: 'excessive_links',
          description: `Too many links (${linkCount})`,
          severity: 'medium'
        });
        result.suggestions.push('Reduce links to 3-5 maximum');
      }
    }

    // 6. Check text-to-image ratio
    if (html) {
      const imageCount = (html.match(/<img /g) || []).length;
      const textLength = body.length;
      
      if (imageCount > 3 && textLength < 200) {
        result.score += 15;
        result.triggers.push({
          type: 'poor_text_ratio',
          description: 'Too many images with little text',
          severity: 'high'
        });
        result.suggestions.push('Add more text content (aim for 60% text, 40% images)');
      }
    }

    // 7. Check for URL shorteners
    const shortenerPatterns = ['bit.ly', 'goo.gl', 'tinyurl', 't.co', 'ow.ly'];
    shortenerPatterns.forEach(pattern => {
      if (fullText.includes(pattern)) {
        result.score += 12;
        result.triggers.push({
          type: 'url_shortener',
          description: `Uses URL shortener: ${pattern}`,
          severity: 'high'
        });
        result.suggestions.push('Use full URLs instead of shortened links');
      }
    });

    // 8. Check for missing unsubscribe link
    if (html && !html.includes('unsubscribe')) {
      result.score += 20;
      result.triggers.push({
        type: 'no_unsubscribe',
        description: 'Missing unsubscribe link',
        severity: 'high'
      });
      result.suggestions.push('Add clear unsubscribe link in footer');
    }

    // 9. Check subject line length
    if (subject.length > 70) {
      result.score += 5;
      result.triggers.push({
        type: 'long_subject',
        description: `Subject too long (${subject.length} chars)`,
        severity: 'low'
      });
      result.suggestions.push('Keep subject line under 60 characters');
    }

    if (subject.length < 10) {
      result.score += 8;
      result.triggers.push({
        type: 'short_subject',
        description: 'Subject too short (may look suspicious)',
        severity: 'medium'
      });
      result.suggestions.push('Make subject line more descriptive (20-50 chars)');
    }

    // 10. Check for excessive numbers/symbols
    const numberCount = (fullText.match(/\d/g) || []).length;
    const textLength = fullText.length;
    if (numberCount / textLength > 0.15) {
      result.score += 10;
      result.triggers.push({
        type: 'excessive_numbers',
        description: 'Too many numbers (looks spammy)',
        severity: 'medium'
      });
      result.suggestions.push('Reduce number of digits in content');
    }

    // Determine risk level
    if (result.score >= 50) {
      result.risk = 'high';
      result.isSpammy = true;
    } else if (result.score >= 25) {
      result.risk = 'medium';
      result.isSpammy = true;
    } else {
      result.risk = 'low';
    }

    return result;
  }

  /**
   * Get spam score only (quick check)
   */
  getSpamScore(subject: string, body: string): number {
    const result = this.checkContent(subject, body);
    return result.score;
  }

  /**
   * Suggest improvements for spammy content
   */
  suggestImprovements(subject: string, body: string, html?: string): string[] {
    const result = this.checkContent(subject, body, html);
    return result.suggestions;
  }
}

export const spamChecker = new SpamChecker();
