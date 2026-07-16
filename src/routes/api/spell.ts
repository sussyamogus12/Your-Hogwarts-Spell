import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const RequestSchema = z.object({
  description: z.string().trim().min(3).max(1500),
  mode: z.enum(["match", "create"]),
});

const MATCH_SYSTEM_PROMPT =
  'Ты - помощник по заклинаниям в Хогвартс. Тебе будет дано описание человека и его характера, а ты должен выбрать для него одно заклинание из "Гарри Поттера". Пиши в ответ строго в две строки:\n1) название заклинания на латинице, затем в скобках русское произношение/перевод, например: Wingardium Leviosa (Вингардиум Левиоса)\n2) краткое описание заклинания ровно на 40 слов.\nНе добавляй ничего, кроме этих двух строк.';

const CREATE_SYSTEM_PROMPT =
  'Ты - создатель новых заклинаний в Хогвартс. Тебе будет дано описание человека и его характера. Придумай для него совершенно новое, уникальное заклинание (которого нет в "Гарри Поттере") с оригинальным названием на латыни в стиле магических формул. Пиши в ответ строго в две строки:\n1) придуманное название заклинания на латинице, затем в скобках русский перевод/транскрипция, например: Lumos Aeterna (Вечный Свет)\n2) краткое описание эффекта ровно на 40 слов.\nНе добавляй ничего, кроме этих двух строк.';

type EngineConfig = {
  name: string;
  apiKey: string | undefined;
  url: string;
  model: string;
};

type EngineOutcome = { content?: string; rateLimited?: boolean };

async function callChatModel(
  engine: EngineConfig,
  systemPrompt: string,
  description: string,
): Promise<EngineOutcome> {
  try {
    const res = await fetch(engine.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${engine.apiKey}`,
      },
      body: JSON.stringify({
        model: engine.model,
        temperature: 0.9,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: description },
        ],
      }),
    });

    if (!res.ok) {
      return { rateLimited: res.status === 429 };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    return content ? { content } : {};
  } catch {
    return {};
  }
}

export const Route = createFileRoute("/api/spell")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Некорректный запрос." }, { status: 400 });
        }

        const parsed = RequestSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Опишите себя подробнее (от 3 символов)." },
            { status: 400 },
          );
        }

        const { description, mode } = parsed.data;
        const systemPrompt =
          mode === "create" ? CREATE_SYSTEM_PROMPT : MATCH_SYSTEM_PROMPT;

        // Пробуем движки по очереди: ChatGPT -> DeepSeek -> встроенный ИИ Lovable.
        const engines: EngineConfig[] = [
          {
            name: "OpenAI",
            apiKey: process.env.OPENAI_API_KEY,
            url: "https://api.openai.com/v1/chat/completions",
            model: "gpt-4o-mini",
          },
          {
            name: "DeepSeek",
            apiKey: process.env.DEEPSEEK_API_KEY,
            url: "https://api.deepseek.com/chat/completions",
            model: "deepseek-chat",
          },
          {
            name: "Lovable",
            apiKey: process.env.LOVABLE_API_KEY,
            url: "https://ai.gateway.lovable.dev/v1/chat/completions",
            model: "google/gemini-3-flash-preview",
          },
        ];

        let rateLimited = false;

        for (const engine of engines) {
          if (!engine.apiKey) continue;
          const outcome = await callChatModel(engine, systemPrompt, description);
          if (outcome.content) {
            return Response.json({ result: outcome.content });
          }
          if (outcome.rateLimited) rateLimited = true;
        }

        if (rateLimited) {
          return Response.json(
            { error: "Слишком много заклинаний сразу. Подождите немного." },
            { status: 429 },
          );
        }

        return Response.json(
          { error: "Магия дала сбой. Попробуйте ещё раз." },
          { status: 502 },
        );
      },
    },
  },
});
