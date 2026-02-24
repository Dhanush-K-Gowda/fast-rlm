import { OpenAI, APIConnectionError, RateLimitError, APIError } from "openai";
import chalk from "npm:chalk@5";
import { SYSTEM_PROMPT, LEAF_AGENT_SYSTEM_PROMPT } from "./prompt.ts";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 1000;
const DEFAULT_TIMEOUT_MS = 30000;

export interface ApiRetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    timeoutMs?: number;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetriableError(error: unknown): boolean {
    if (error instanceof RateLimitError) return true;
    if (error instanceof APIConnectionError) return true;
    if (error instanceof APIError) {
        const status = error.status;
        return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
    }
    if (error instanceof TypeError) return true;
    return false;
}

export interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cached_tokens: number;
    reasoning_tokens: number;
    cost: number | undefined;
}

interface CodeReturn {
    code: string;
    success: boolean;
    message: any;
    usage: Usage;
}

const apiKey = Deno.env.get("RLM_MODEL_API_KEY") || Deno.env.get("OPENROUTER_API_KEY");
const baseURL = Deno.env.get("RLM_MODEL_BASE_URL") || "https://openrouter.ai/api/v1";

if (!apiKey) {
    throw new Error(
        "RLM_MODEL_API_KEY environment variable is missing or empty. " +
        "Set it to your API key, e.g.: export RLM_MODEL_API_KEY='sk-...'"
    );
}

export async function generate_code(
    messages: any[],
    model_name: string,
    is_leaf_agent: boolean = false,
    options?: ApiRetryOptions
): Promise<CodeReturn> {
    const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    const initialDelayMs = options?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const client = new OpenAI({
        apiKey,
        baseURL,
    });

    let lastError: unknown;
    let delay = initialDelayMs;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const completion = await client.chat.completions.create({
                model: model_name,
                messages: [
                    { role: "system", content: is_leaf_agent ? LEAF_AGENT_SYSTEM_PROMPT : SYSTEM_PROMPT },
                    ...messages
                ],
            }, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const content = completion.choices[0].message.content || "";

            const replMatches = [...content.matchAll(/```repl([\s\S]*?)```/g)];
            let code = replMatches.map(m => m[1].trim()).join("\n");

            const usage: Usage = {
                prompt_tokens: completion.usage?.prompt_tokens ?? 0,
                completion_tokens: completion.usage?.completion_tokens ?? 0,
                total_tokens: completion.usage?.total_tokens ?? 0,
                cached_tokens: completion.usage?.prompt_tokens_details?.cached_tokens ?? 0,
                reasoning_tokens: completion.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
                cost: (completion.usage as any)?.cost ?? undefined,
            };

            if (!code) {
                return {
                    code: "",
                    success: false,
                    message: completion.choices[0].message,
                    usage,
                };
            }

            return {
                code,
                success: true,
                message: completion.choices[0].message,
                usage,
            };
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries - 1 && isRetriableError(error)) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error(chalk.yellow(`⚠ API error (attempt ${attempt + 1}/${maxRetries}): ${msg}`));
                console.error(chalk.dim(`   Retrying in ${delay}ms...`));
                await sleep(delay);
                delay *= 2;
                continue;
            }
            break;
        }
    }

    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(chalk.red(`✖ API call failed after ${maxRetries} retries: ${msg}`));
}

if (import.meta.main) {
    // Test with a dummy context
    const query_context = "Just return fibonacci sequence";
    const out = await generate_code([
        { "role": "user", "content": query_context },
    ], "gpt-5-mini"
    );
    console.log(out)

}

