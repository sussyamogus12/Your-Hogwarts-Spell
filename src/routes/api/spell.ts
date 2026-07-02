import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const RequestSchema = z.object({
  description: z.string().trim().min(3).max(1500),
  mode: z.enum(["match", "create"]),
});

const MATCH_SYSTEM_PROMPT =
  'Ты - помощник по заклинаниям в Хогвартс. Тебе будет дано описание человека и его характера, а ты должен выбрать для него одно заклинание из "Гарри Поттера". Пиши в ответ только название заклинания и краткое описание на 40 слов.';

const CREATE_SYSTEM_PROMPT =
  'Ты - создатель новых заклинаний в Хогвартс. Тебе будет дано описание человека и его характера. Придумай для него совершенно новое, уникальное заклинание (которого нет в "Гарри Поттере") с оригинальным названием на латыни в стиле магических формул. Пиши в ответ только придуманное название заклинания и краткое описание его эффекта на 40 слов.';

export const Route = createFileRoute("/api/spell")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Ключ OpenAI не настроен." },
            { status: 500 },
          );
        }

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

        let openaiRes: Response;
        try {
          openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              temperature: 0.9,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: description },
              ],
            }),
          });
        } catch {
          return Response.json(
            { error: "Не удалось связаться с магической сетью. Попробуйте позже." },
            { status: 502 },
          );
        }

        if (!openaiRes.ok) {
          if (openaiRes.status === 429) {
            return Response.json(
              { error: "Слишком много заклинаний сразу. Подождите немного." },
              { status: 429 },
            );
          }
          if (openaiRes.status === 401) {
            return Response.json(
              { error: "Ключ OpenAI недействителен." },
              { status: 500 },
            );
          }
          return Response.json(
            { error: "Магия дала сбой. Попробуйте ещё раз." },
            { status: 502 },
          );
        }

        const data = (await openaiRes.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
          return Response.json(
            { error: "Заклинание рассеялось. Попробуйте ещё раз." },
            { status: 502 },
          );
        }

        return Response.json({ result: content });
      },
    },
  },
});