const { StartChannelCommand } = require("@aws-sdk/client-medialive");

const client = require("./client");

const command = new StartChannelCommand({
  ChannelId: process.env.AWS_MEDIALIVE_CHANNEL_ID
});

async function start() {
  try {
    await client.send(command);
    console.log("[AWS] stream started.");
  } catch (error) {
    console.error(error);
  };
};

start();