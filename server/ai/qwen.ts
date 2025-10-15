import fetch from 'node-fetch';

export class QwenLLM {
  private apiKey: string;
  private endpoint = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY!;
    if (!this.apiKey) throw new Error('Missing QWEN_API_KEY');
  }

  private headers() {
    return {
      'X-DashScope-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  async classifyReply(text: string) {
    if (!text?.trim()) {
      return { classification: 'negative', score: 0, summary: 'No content', next_action: 'suppress' as const };
    }

    const prompt = `
You are the AI engine of Argilette's NODE CRM. Analyze this email reply.

Return JSON with:
- classification: "positive"|"question"|"meeting_request"|"unsubscribe"|"negative"
- score: 0-100 (likelihood to convert)
- summary: one-sentence summary
- next_action: "route_to_sales"|"send_followup"|"add_to_nurture"|"suppress"

EMAIL:
"""
${text}
"""
`;

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model: 'qwen-turbo',
          input: {
            messages: [
              { role: 'system', content: 'You are the AI brain of Argilette NODE CRM.' },
              { role: 'user', content: prompt }
            ]
          },
          parameters: { max_tokens: 500 }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`Qwen error: ${data.message || res.statusText}`);

      let content = data.output.choices[0].message.content.trim();
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;

      return JSON.parse(jsonStr);

    } catch (e) {
      console.error('⚠️ Qwen classification fallback:', e instanceof Error ? e.message : String(e));
      return {
        classification: 'negative',
        score: 20,
        summary: 'AI classification failed — safe fallback',
        next_action: 'add_to_nurture' as const
      };
    }
  }
}

export const qwen = new QwenLLM();