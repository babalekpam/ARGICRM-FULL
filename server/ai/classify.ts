import { qwen } from './qwen';

export async function classifyReplyForNodeCRM(text: string) {
  return await qwen.classifyReply(text);
}