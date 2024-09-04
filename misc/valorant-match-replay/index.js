require("dotenv/config");

const ms = require("ms");
const { fetch, Agent } = require("undici");
const path = require("node:path");
const { existsSync } = require("node:fs");
const { readFile } = require("node:fs/promises");

// obs
const { OBSWebSocket, EventSubscription } = require("obs-websocket-js");
const obs = new OBSWebSocket();

const dispatcher = new Agent({
  connect: {
    rejectUnauthorized: false
  }
});

// riot games
const lockfilePath = path.join(process.env.LOCALAPPDATA, 'Riot Games', 'Riot Client', 'Config', 'lockfile');
if (!existsSync(lockfilePath)) {
  throw "Invalid Riot Client lockfile.";
};

// cache
let riotLockFile = null;
let isOBSConnected = false;
let [currentTeamScore, currentEnemyScore] = [0, 0];
let currentlyShowing = false;

const currentPreferredProgramScene = "⏯️ REPLAY";

async function init() {
  try {
    if (currentlyShowing === true) {
      const currentProgramScene = await obs.call("GetCurrentProgramScene");
      
      if (currentProgramScene === currentPreferredProgramScene) {
        return;
      } else {
        currentlyShowing = false;

        await postTimeCurrentRound();
      };
    };

    // obs connect
    if (!isOBSConnected) {
      try {
        await obs.connect(undefined, process.env.NEXT_PUBLIC_OBS_WS_KEY, {
          eventSubscriptions: EventSubscription.Scenes,
          rpcVersion: 1
        });

        obs.on("ConnectionClosed", () => isOBSConnected = false);

        isOBSConnected = true;

        console.log("OBS connected.");
      } catch (error) {
        if (String(error).match("ECONNREFUSED")) {
          console.error("No OBS starting.");
        } else {
          console.error(error);
        };
      };
    };

    // get lock file
    if (riotLockFile === null) {
      let contents = await readFile(lockfilePath, { encoding: 'utf-8', flag: 'r' });
      let args = contents.split(':');

      let finalLockFileContent = {
        port: args[2],
        key: args[3]
      };

      riotLockFile = finalLockFileContent;
    };

    if (!riotLockFile) {
      throw "Riot Lock File is empty even after check.";
    };

    let headers = {
      'Authorization': `Basic ${Buffer.from(`riot:${riotLockFile.key}`).toString('base64')}`
    };

    const req = await fetch(`https://127.0.0.1:${riotLockFile.port}/chat/v4/presences`, {
      headers, dispatcher, method: "GET"
    });

    const data = await req.json();

    if (!data || !Array.isArray(data?.presences)) {
      riotLockFile = null;
      
      throw "Invalid presences after request.";
    };

    const selfData = data.presences.filter(presence => `${presence.game_name}#${presence.game_tag}` === process.env.VALORANT_TAG);
    if (!selfData?.length) {
      throw "No self data found after filter.";
    };

    const currentSelfData = selfData[0];
    if (!currentSelfData?.private?.length) {
      throw "Unknown private.";
    };

    const decodedSelfData = JSON.parse(Buffer.from(currentSelfData.private, "base64").toString());

    // it begins here.
    const session = decodedSelfData?.sessionLoopState;
    if (session === "MATCHMAKING") {
      await postTimeCurrentRound();
    };

    if (session !== "INGAME") return;

    const queueId = decodedSelfData?.queueId;
    const whitelistedQueueId = ["swiftplay", "competitive", "unrated"];
    if (!whitelistedQueueId.some(name => queueId === name)) return;

    const [teamScore, enemyScore] = [decodedSelfData?.partyOwnerMatchScoreAllyTeam || 0, decodedSelfData?.partyOwnerMatchScoreEnemyTeam || 0];
    if (teamScore === 0 && enemyScore === 0) {
      return;
    };

    if (currentTeamScore === teamScore && currentEnemyScore === enemyScore) {
      return;
    };

    currentTeamScore = teamScore;
    currentEnemyScore = enemyScore;

    // check if the footage is available
    const footageReq = await fetch("http://127.0.0.1:3000/api/valorant/replay/currentReplay", {
      method: "GET"
    });

    const footageData = await footageReq.json();
    if (!footageData || !Array.isArray(footageData) || footageData.length <= 0) {
      return;
    };

    currentlyShowing = true;

    console.log("Switching to REPLAY scene in 5 seconds");

    setTimeout(async () => {
      try {
        await obs.call("SetCurrentProgramScene", {
          sceneName: currentPreferredProgramScene
        });
      } catch {};
    }, ms("5s"));
  } catch (error) {
    console.error(error);
  };

  return;
};

setTimeout(init, ms("2.5s"));

const postTimeCurrentRound = () => {
  return fetch("http://127.0.0.1:3000/api/valorant/replay/trackTime", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      time: Date.now()
    })
  });
};

const getRandomIntInclusive = (min, max) => {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);

  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
};

setInterval(init, getRandomIntInclusive(ms("5s"), ms("7.5s")));