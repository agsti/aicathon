import { PGChunk, PGEssay, PGJSON, Tramite } from "@/types";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { encode } from "gpt-3-encoder";

const BASE_URL =
  "https://administracion.gob.es/pagFront/%20tramites/fichaTramite.htm";
const CHUNK_SIZE = 200;

const getLinks = () => {
  let linksArr: string[] = [];
  const N_TRAMITES = 4548;
  for (let tramiteId = 1; tramiteId <= N_TRAMITES; tramiteId++) {
    const url = `${BASE_URL}?idTramiteSeleccionado=${tramiteId}`;
    linksArr.push(url);
  }

  return linksArr;
};

const getTramite = async (url: string) => {
  const html = await axios.get(url);
  const $ = cheerio.load(html.data);
  const title = $(".ppg-heading").html();
  const content = $("div.t-margin-bottom-40").html()?.trim() + " Procedimiento";
  const tokens = content ? encode(content) : ([] as number[]);
  let tramite: Tramite = {
    title: title || "no_title",
    url: url,
    content: content || "no content",
    content_length: content?.length || 0,
  };
  return tramite;
};

(async () => {
  const links = getLinks();

  for (let i = 0; i < links.length; i++) {
    console.log(links[i]);
    const tramite = await getTramite(links[i]);
    fs.writeFileSync(`scripts/tramites/${i}`, JSON.stringify(tramite));
  }
})();
