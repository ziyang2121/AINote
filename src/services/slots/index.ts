import type { Intent, SlotDefinition } from '@/types/conversation';
import type { ZhipuMessage } from '@/services/ai';
import { callApi } from '@/services/ai';
import { getSlotDefinitions } from './definitions';

/**
 * 从用户输入中提取槽位值
 */
async function extractSlotsFromInput(
  input: string,
  definitions: SlotDefinition[],
): Promise<Record<string, unknown>> {
  if (definitions.length === 0) return {};

  const fieldDesc = definitions
    .map((d) => `${d.name}(${d.type}${d.required ? ', 必填' : ''})`)
    .join(', ');

  const messages: ZhipuMessage[] = [
    {
      role: 'system',
      content: `从用户输入中提取信息。需要的字段：${fieldDesc}
规则：
- 以 JSON 格式输出提取结果
- 未找到的字段设为 null
- 日期格式为 YYYY-MM-DD
- entity_ref 类型：尝试匹配实体名称，输出名称字符串
- 只输出 JSON，不要其他内容`,
    },
    { role: 'user', content: input },
  ];

  const response = await callApi(messages);
  const text = (response.content ?? '').trim();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]!) as Record<string, unknown>;
    }
  } catch {
    // JSON parse failed
  }
  return {};
}

/**
 * 检查必填槽位是否完整，返回缺失的槽位名列表
 */
export function checkMissingSlots(
  intent: Intent,
  slots: Record<string, unknown>,
): string[] {
  const definitions = getSlotDefinitions(intent);
  return definitions
    .filter((d) => d.required && (slots[d.name] === undefined || slots[d.name] === null))
    .map((d) => d.name);
}

/**
 * 生成追问消息
 */
export function generateAskMessage(intent: Intent, missingSlots: string[]): string {
  const definitions = getSlotDefinitions(intent);
  const missing = definitions.filter((d) => missingSlots.includes(d.name));

  if (missing.length === 0) return '';

  const prompts = missing
    .map((d) => d.askPrompt ?? `请提供${d.name}`)
    .join('；');

  return prompts;
}

/**
 * 槽位收集入口：提取 + 合并 + 校验
 */
export async function collectSlots(
  input: string,
  intent: Intent,
  existingSlots: Record<string, unknown>,
): Promise<{
  slots: Record<string, unknown>;
  missingSlots: string[];
}> {
  const definitions = getSlotDefinitions(intent);

  const extracted = await extractSlotsFromInput(input, definitions);

  const merged: Record<string, unknown> = { ...existingSlots };
  for (const [key, value] of Object.entries(extracted)) {
    if (value !== null && value !== undefined) {
      merged[key] = value;
    }
  }

  const missingSlots = checkMissingSlots(intent, merged);

  return { slots: merged, missingSlots };
}

export { getSlotDefinitions } from './definitions';
