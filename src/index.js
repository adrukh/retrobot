// Load environment variables
require('dotenv').config();

// Import modules
const app = require('./slack');
const { handleMention } = require('./handlers/commands');
const { handleDMMessage } = require('./handlers/messages');
const { handleStartOver } = require('./handlers/actions');

// Register event handlers
app.message(async (args) => {
  const { message, context } = args;
  
  // Handle DM messages
  if (message.channel_type === 'im' && !message.bot_id) {
    await handleDMMessage(args);
    return;
  }
  
  // Check if this is a mention of our bot (fallback for when app_mention doesn't fire)
  if ((message.channel_type === 'channel' || message.channel_type === 'group') && 
      message.text && 
      message.text.includes(`<@${context.botUserId}>`)) {
    // Convert message event to app_mention event format
    const mentionArgs = {
      event: message,
      client: args.client,
      context: args.context
    };
    await handleMention(mentionArgs);
  }
});

// Primary handler for mentions in channels - this is the correct way in Socket Mode
app.event('app_mention', async (args) => {
  await handleMention(args);
});

app.action('dm_start_over', handleStartOver);

// Start the app
(async () => {
  try {
    await app.start();
    console.log('⚡️ retrobot is running');
  } catch (error) {
    console.error('Failed to start retrobot:', error);
    process.exit(1);
  }
})();