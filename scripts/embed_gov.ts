import { PGEssay, PGJSON, Tramite } from "@/types";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";

loadEnvConfig("");

const generateEmbeddings = async (filename, tramite: Tramite) => {
  if (
    tramite.title == "no_title" ||
    tramite.content == "undefined Procedimiento"
  ) {
    console.log(filename, "is invalid");
    return;
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { title, url, content, content_length, tokens } = tramite;

  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: content,
  });

  const [{ embedding }] = embeddingResponse.data.data;

  const { data, error } = await supabase
    .from("pg")
    .insert({
      title,
      url,
      content,
      content_length,
      embedding,
    })
    .select("*");

  if (error) {
    console.log("error", error);
  } else {
    console.log("saved", i, j);
  }

  await new Promise((resolve) => setTimeout(resolve, 200));
};

(async () => {
  const tramites_folder = "scripts/tramites";
  const files = fs.readdirSync(tramites_folder);
  for (let index = 0; index < 1; index++) {
    const f = `scripts/tramites/${files[index]}`;
    const tramite: Tramite = JSON.parse(fs.readFileSync(f, "utf8"));
    await generateEmbeddings(files[index], tramite);
  }
})();
