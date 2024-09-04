import type { NextApiRequest, NextApiResponse } from "next";
import path from "node:path";
import { existsSync, readdirSync, statSync } from "node:fs";

import { currentTimePerRound } from "./trackTime";
import { valorantClipsDirPath } from "@/config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(400).end();
  };
  
  // i use outplayed by Overwolf for this
  if (!existsSync(valorantClipsDirPath)) {
    return res.json([]);
  };

  const valorantClips = readdirSync(valorantClipsDirPath, { withFileTypes: true });

  const filteredFolder = valorantClips.filter(folder => folder.isDirectory());

  const listFoldersFullPath = filteredFolder.map(folder => folder.name);

  const sortFolders = listFoldersFullPath
  .map(folder => ({ name: folder, ctimeMs: statSync(path.join(valorantClipsDirPath, folder)).ctimeMs }))
  .sort((a, b) => b.ctimeMs - a.ctimeMs);

  const currentNewestFolderName = sortFolders[0].name;
  const newestFolderPath = path.join(valorantClipsDirPath, currentNewestFolderName);
  const currentValClipFiles = readdirSync(newestFolderPath);

  const recentValClipFiles = currentValClipFiles
  .map(file => ({ name: file, ctimeMs: statSync(path.join(newestFolderPath, file)).ctimeMs }))
  .filter(file => file.ctimeMs >= currentTimePerRound)
  .map(file => file.name);

  if (!recentValClipFiles?.length) {
    return res.json([]);
  };

  const finalReplays = recentValClipFiles.map(file => currentNewestFolderName + "/" + file);

  return res.json(finalReplays);
};