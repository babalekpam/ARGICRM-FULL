import { ask, askJSON, complete, isAIAvailable, getActiveProvider } from "./ai-adapter.js";


export async function generateEmailCopy(opts: {
  contactName: string;
  company?: string;
  jobTitle?: string;
  purpose: string; // "cold outreach", "follow-up", "proposal", "re-engagement"
  tone?: string; // "professional", "friendly", "direct"
  senderName: string;
  senderCompany: string;
}): Promise<{ subject: string; body: string }> {
  if (!isAIAvailable()) {
    return {
      subject: `Quick question for ${opts.contactName}`,
      body: `Hi ${opts.contactName},\n\nI wanted to reach out regarding ${opts.purpose}.\n\nBest regards,\n${opts.senderName}`,
    };
  }

  const msg = await complete({ messages: [{
      role: "user",
      content: `Write a ${opts.tone || "professional"} ${opts.purpose} email.
Contact: ${opts.contactName}${opts.jobTitle ? `, ${opts.jobTitle}` : ""}${opts.company ? ` at ${opts.company}` : ""}
From: ${opts.senderName} at ${opts.senderCompany}

Return JSON only: {"subject": "...", "body": "..."}
Keep the email concise (under 150 words), genuine, no fluff.`,
    }], maxTokens: 600 });

  try {
    const text = msg;
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { subject: `Following up — ${opts.purpose}`, body: `Hi ${opts.contactName},\n\nI wanted to connect about ${opts.purpose}.\n\nBest,\n${opts.senderName}` };
  }
}

export async function scoreLeadWithAI(lead: {
  firstName: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  email?: string;
}): Promise<{ score: number; reasoning: string }> {
  if (!isAIAvailable()) return { score: 50, reasoning: "AI scoring unavailable" };

  const msg = await complete({ messages: [{
      role: "user",
      content: `Score this B2B lead 0-100 for purchase likelihood.
Name: ${lead.firstName}
Company: ${lead.company || "unknown"}
Title: ${lead.jobTitle || "unknown"}
Source: ${lead.source || "unknown"}
Email: ${lead.email ? (lead.email.includes("gmail") || lead.email.includes("yahoo") ? "personal" : "business") : "none"}

Return JSON only: {"score": number, "reasoning": "one sentence"}`,
    }], maxTokens: 200 });

  try {
    const text = msg;
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { score: 50, reasoning: "Could not score automatically" };
  }
}
