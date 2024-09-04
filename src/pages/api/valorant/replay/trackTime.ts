import type { NextApiRequest, NextApiResponse } from "next";

export let currentTimePerRound: number = Date.now();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(400).end();
  };

  if (!req?.body?.time || typeof req.body.time !== "number" || isNaN(+req.body.time)) {
    return res.status(400).send("Invalid number.");
  };

  const time = +req.body.time;

  currentTimePerRound = time;

  if (process.env.NODE_ENV === "development") {
    console.log(`Time posted: ${time}`);
  };

  res.status(200).end();

  return;
};