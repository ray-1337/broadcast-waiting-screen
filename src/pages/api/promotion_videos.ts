import { NextApiRequest, NextApiResponse } from "next";
import { readdir } from "fs/promises";
import path from "node:path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const videos = await readdir(path.join(process.cwd(), "public", "promotion_videos"));

  return res.json(videos || []);
};