import { supabaseAdmin } from "@/utils";

export const config = {
  runtime: "edge",
};

const openAiApiKey = process.env.OPENAI_API_KEY;
const handler = async (req: Request): Promise<Response> => {
  try {
    const { query, matches } = (await req.json()) as {
      query: string;
      matches: number;
    };

    const translatedQuery = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `translate the following text into spanish (if it's not already in spanish): ${query}`,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const translateResponse = await translatedQuery.json();
    console.log(translateResponse);
    const input = translateResponse["choices"][0]["message"]["content"];

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: input.replace(/\n/g, " "),
      }),
    });

    const json = await res.json();
    const embedding = json.data[0].embedding;

    const { data: chunks, error } = await supabaseAdmin.rpc("pg_search", {
      query_embedding: embedding,
      similarity_threshold: 0.01,
      match_count: matches,
    });

    if (error) {
      console.error(error);
      return new Response("Error", { status: 500 });
    }

    return new Response(
      JSON.stringify({
        chunks,
        input,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
};

export default handler;
