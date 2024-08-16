import { NextApiRequest, NextApiResponse } from "next";
import { readdir } from "fs/promises";
import path from "node:path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // the files inside the folder is "{ARTIST} - {TITLE}.mp3"
  const audios = await readdir(path.join(process.cwd(), "public", "waiting_audios"));

  return res.json(audios.map((val) => {
    const [artist, title] = val.split(" - ");
    return { artist, title, raw: val }
  }));
};