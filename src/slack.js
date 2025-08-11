const { App } = require('@slack/bolt');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  socketModeOptions: {
    pingInterval: 30000,  // Send ping every 30 seconds
    pongTimeout: 10000    // Wait 10 seconds for pong response
  }
});

module.exports = app;