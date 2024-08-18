const { StartChannelCommand, DescribeChannelCommand } = require("@aws-sdk/client-medialive");

const client = require("./client");

const ChannelId = process.env.AWS_MEDIALIVE_CHANNEL_ID;

const command = new StartChannelCommand({ ChannelId });

async function start() {
  try {
    const channelStatus = await client.send(new DescribeChannelCommand({ ChannelId }));
    if (channelStatus.State === "RUNNING") {
      console.error("[AWS] The current streaming is already running.");
      return;
    };

    await client.send(command);
    console.log("[AWS] stream started.");
  } catch (error) {
    console.error(error);
  };
};

start();