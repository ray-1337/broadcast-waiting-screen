require("dotenv/config");

const { MediaLiveClient } = require("@aws-sdk/client-medialive");

const client = new MediaLiveClient({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_MEDIALIVE_ACCESS_KEY,
    secretAccessKey: process.env.AWS_MEDIALIVE_SECRET_KEY
  }
});

module.exports = client;