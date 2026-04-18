import { getModelForPhase } from "@/lib/orchestration/config";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export async function runOpenAIJson<T>({
  phase,
  system,
  input
}: {
  phase: "phase2" | "phase3" | "phase4";
  system: string;
  input: unknown;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: getModelForPhase(phase),
      instructions: system,
      input: JSON.stringify(input, null, 2)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as OpenAIResponse;
  const text = extractOutputText(payload);

  return parseJson<T>(text);
}

function extractOutputText(payload: OpenAIResponse) {
  if (payload.output_text) {
    return payload.output_text;
  }

  const joined =
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? "")
      .join("\n")
      .trim() ?? "";

  if (!joined) {
    throw new Error("OpenAI response did not include text output.");
  }

  return joined;
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}$/);

    if (match) {
      return JSON.parse(match[0]) as T;
    }

    throw new Error("Model response was not valid JSON.");
  }
}
