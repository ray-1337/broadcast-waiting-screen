import type { NextApiRequest, NextApiResponse } from "next";
import path from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

import { valorantClipsDirPath } from "@/config";

const CHUNK_SIZE = 10 ** 6;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let range = req.headers.range;
  if (!range) {
    range = "0";
  };

  const filePath = path.join(valorantClipsDirPath, ...(req.query.fileName as string[]));
  
  const videoInfo = await stat(filePath);
  
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoInfo.size - 1);
  const contentLength = end - start + 1;

  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoInfo.size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };
  
  res.writeHead(206, headers);

  const videoStream = createReadStream(filePath, { start, end });

  videoStream.pipe(res);

  return;
};