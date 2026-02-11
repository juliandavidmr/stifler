import Anthropic from "@anthropic-ai/sdk";
import { RELEVANCE_EVALUATION_PROMPT } from "./prompts.ts";
import { buildMemoryBlock } from "../../memory/injector.ts";
import { getConfig } from "../../config/manager.ts";
import { getDaemonConfig } from "../config";
import type { PolledItem, RelevanceResult } from "../../types/daemon.ts";

export async function evaluateRelevance(
  item: PolledItem,
): Promise<RelevanceResult> {
  const config = getConfig();
  const daemonConfig = getDaemonConfig();

  if (!config.anthropicApiKey) {
    return {
      isRelevant: false,
      reason: "No API key configured",
      suggestedNotification: null,
    };
  }

  const memories = buildMemoryBlock();
  const timestamp = new Date(item.timestamp).toLocaleString();

  const prompt = RELEVANCE_EVALUATION_PROMPT.replace(
    "{{memories}}",
    memories || "No memories stored.",
  )
    .replace("{{source}}", item.source)
    .replace("{{title}}", item.title)
    .replace("{{body}}", item.body)
    .replace("{{timestamp}}", timestamp);

  try {
    const client = new Anthropic({ apiKey: config.anthropicApiKey });
    const response = await client.messages.create({
      model: daemonConfig.model,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        isRelevant: false,
        reason: "Could not parse Claude response",
        suggestedNotification: null,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      isRelevant: Boolean(parsed.isRelevant),
      reason: parsed.reason || "",
      suggestedNotification: parsed.notification || null,
    };
  } catch (error: any) {
    console.error(`[daemon] Relevance evaluation failed: ${error.message}`);
    return {
      isRelevant: false,
      reason: `Error: ${error.message}`,
      suggestedNotification: null,
    };
  }
}
