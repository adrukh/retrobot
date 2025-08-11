const SessionManager = require('../managers/SessionManager');
const DMStateManager = require('../managers/DMStateManager');
const { getChannelMembers } = require('../services/slack');
const { sendInitialDM } = require('../services/dm');
const { presentResponses, summarizeVotes } = require('../services/voting');

// Command handler functions
async function handleHello(respond) {
  await respond({
    text: '👋 retrobot is running!\nReady to help coordinate your team discussions.\nMention me with `@retrobot help` for available commands.',
    response_type: 'ephemeral'
  });
}

async function handleHelloMention(client, channelId) {
  await client.chat.postMessage({
    channel: channelId,
    text: '👋 retrobot is running!\nReady to help coordinate your team discussions.\nMention me with `@retrobot help` for available commands.'
  });
}

async function handleHelp(respond) {
  const availableSets = SessionManager.getAvailableQuestionSets().join(', ');
  
  await respond({
    text: `🗓️ retrobot Commands:

\`@retrobot start <question-set> [--anonymous]\`
  Start a new retrospective session
  Example: \`@retrobot start retrospective --anonymous\`

\`@retrobot present\`
  Manually post responses for voting (auto-presents when all done)

\`@retrobot summarize [--top N]\`
  Show top-voted topics (default: top 3 per question)
  Example: \`@retrobot summarize --top 2\`

\`@retrobot reset\`
  Cancel current session and clear all responses

Available question sets: ${availableSets}
Use \`--anonymous\` flag to hide participant names`,
    response_type: 'ephemeral'
  });
}

async function handleHelpMention(client, channelId) {
  const availableSets = SessionManager.getAvailableQuestionSets().join(', ');
  
  // Send help to the channel where the mention occurred
  await client.chat.postMessage({
    channel: channelId,
    text: `🗓️ retrobot Commands:

\`@retrobot start <question-set> [--anonymous]\`
  Start a new retrospective session
  Example: \`@retrobot start retrospective --anonymous\`

\`@retrobot present\`
  Manually post responses for voting (auto-presents when all done)

\`@retrobot summarize [--top N]\`
  Show top-voted topics (default: top 3 per question)
  Example: \`@retrobot summarize --top 2\`

\`@retrobot reset\`
  Cancel current session and clear all responses

Available question sets: ${availableSets}
Use \`--anonymous\` flag to hide participant names`
  });
}

async function handleStart(args, channelId, moderatorId, respond, client) {
  const activeSession = SessionManager.getSession();
  if (activeSession) {
    throw new Error(`Active retro session already running in <#${activeSession.channelId}>\nUse commands from <#${activeSession.channelId}> or wait for it to complete.`);
  }

  // Parse arguments
  let questionSet = 'retrospective';
  let anonymous = false;
  let customQuestions = null;

  if (args.length > 0) {
    // Check for anonymous flag
    anonymous = args.includes('--anonymous');
    const filteredArgs = args.filter(arg => arg !== '--anonymous');

    if (filteredArgs.length > 0) {
      if (filteredArgs[0] === 'custom') {
        customQuestions = SessionManager.parseCustomQuestions(filteredArgs.slice(1));
        if (customQuestions.length === 0) {
          throw new Error('Custom question set requires at least one question in quotes');
        }
        questionSet = 'custom';
      } else {
        questionSet = filteredArgs[0];
        if (!SessionManager.getAvailableQuestionSets().includes(questionSet)) {
          const available = SessionManager.getAvailableQuestionSets().join(', ');
          throw new Error(`Unknown question set: '${questionSet}'\nAvailable: ${available}`);
        }
      }
    }
  }

  // Create session
  const session = SessionManager.createSession(channelId, moderatorId, questionSet, anonymous);
  if (customQuestions) {
    session.questions = customQuestions;
  }

  // Get channel members
  const members = await getChannelMembers(channelId);
  const participantCount = members.length;
  
  // Set total expected participants
  session.totalParticipants = participantCount;

  // Initialize DM states for all participants
  for (const userId of members) {
    DMStateManager.initializeUser(userId, session.questions);
  }

  // Send DMs to all participants
  let dmsSent = 0;
  const failedDMs = [];
  
  for (const userId of members) {
    const success = await sendInitialDM(client, userId, session, moderatorId, channelId);
    if (success) {
      dmsSent++;
    } else {
      failedDMs.push(userId);
      // Remove user from DM state since we couldn't reach them
      DMStateManager.delete(userId);
    }
  }
  
  // Update total participants to only include those we could DM
  session.totalParticipants = dmsSent;

  // Respond to the channel
  const modeText = anonymous ? 'Anonymous 🔒' : 'Named 👤';
  let responseText = `🗓️ Starting agenda session: ${questionSet}
Mode: ${modeText} | Questions: ${session.questions.length}
DMing ${participantCount} participants... ✅ ${dmsSent} sent successfully`;

  if (failedDMs.length > 0) {
    responseText += `\n⚠️ ${failedDMs.length} DMs failed (users may have DMs disabled)`;
  }

  responseText += '\n\nResponses will be automatically presented for voting when everyone finishes.';

  if (respond) {
    await respond({
      text: responseText,
      response_type: 'in_channel'
    });
  } else {
    await client.chat.postMessage({
      channel: channelId,
      text: responseText
    });
  }
}

async function handleStatus(channelId, respond, client) {
  const activeSession = SessionManager.getSession();
  if (!activeSession) {
    const message = '📊 No active retro session\nMention me with `@retrobot start` to begin a new session.';
    if (respond) {
      await respond({
        text: message,
        response_type: 'ephemeral'
      });
    } else {
      await client.chat.postMessage({
        channel: channelId,
        text: message
      });
    }
    return;
  }

  // Get all channel members for the active session
  const allMembers = await getChannelMembers(activeSession.channelId);
  const completed = DMStateManager.getCompletedUsers();
  const inProgress = DMStateManager.getInProgressUsers();
  const notStarted = DMStateManager.getNotStartedUsers(allMembers);

  let statusText = `📊 Session Status: <#${activeSession.channelId}> (started by <@${activeSession.moderatorId}>)\n\n`;

  if (activeSession.status === 'collecting') {
    statusText += `🔄 Collecting responses...
✅ Completed: ${completed.length}/${allMembers.length} participants`;
    
    if (completed.length > 0) {
      const completedMentions = completed.slice(0, 5).map(id => `<@${id}>`).join(', ');
      const moreText = completed.length > 5 ? ` (+${completed.length - 5} more)` : '';
      statusText += ` (${completedMentions}${moreText})`;
    }

    statusText += `\n⏳ In progress: ${inProgress.length} participants`;
    statusText += `\n❌ Not started: ${notStarted.length} participants\n\n`;
    
    const questionList = activeSession.questions.join(' | ');
    statusText += `Questions: ${questionList}\n\n`;
    statusText += `➡️ Next: Responses will auto-present when all participants finish`;

  } else if (activeSession.status === 'voting') {
    // Count total responses and votes
    let totalResponses = 0;
    for (const responses of activeSession.responses.values()) {
      totalResponses += responses.length;
    }

    statusText += `🗳️ Voting in progress...
📝 Total responses posted: ${totalResponses} topics
👍 Vote by reacting to responses with emojis

➡️ Next: Use \`@retrobot summarize\` to show top-voted items`;
  }

  if (respond) {
    await respond({
      text: statusText,
      response_type: 'ephemeral'
    });
  } else {
    await client.chat.postMessage({
      channel: channelId,
      text: statusText
    });
  }
}

async function handlePresent(channelId, respond, client) {
  await presentResponses(client, channelId);
  const message = '✅ Responses posted as individual messages! Team members can now vote on each item.';
  if (respond) {
    await respond({
      text: message,
      response_type: 'ephemeral'
    });
  } else {
    await client.chat.postMessage({
      channel: channelId,
      text: message
    });
  }
}

async function handleSummarize(args, channelId, respond, client) {
  // Parse top count argument
  let topCount = 3;
  if (args.includes('--top')) {
    const topIndex = args.indexOf('--top');
    if (topIndex + 1 < args.length) {
      const count = parseInt(args[topIndex + 1]);
      if (!isNaN(count) && count > 0) {
        topCount = count;
      }
    }
  }

  const messageText = await summarizeVotes(client, channelId, topCount);

  if (respond) {
    await respond({
      text: messageText,
      response_type: 'in_channel'
    });
  } else {
    await client.chat.postMessage({
      channel: channelId,
      text: messageText
    });
  }

  // End the session
  SessionManager.endSession();
  DMStateManager.clear();
}

async function handleReset(channelId, respond, client) {
  const activeSession = SessionManager.getSession();
  if (!activeSession) {
    const message = '📊 No active retro session to reset';
    if (respond) {
      await respond({
        text: message,
        response_type: 'ephemeral'
      });
    } else {
      await client.chat.postMessage({
        channel: channelId,
        text: message
      });
    }
    return;
  }

  // Clear the session
  SessionManager.endSession();
  DMStateManager.clear();

  const message = `🔄 Retro session reset! All responses have been cleared.\nUse \`@retrobot start\` to begin a new session.`;
  if (respond) {
    await respond({
      text: message,
      response_type: 'in_channel'
    });
  } else {
    await client.chat.postMessage({
      channel: channelId,
      text: message
    });
  }
}

// Main mention handler
async function handleMention({ event, client }) {
  // Handle both app_mention events and message events for compatibility
  const message = event || arguments[0].message;
  
  // Only handle mentions in channels (not DMs)
  if (message?.channel_type === 'im') {
    return;
  }
  
  const userId = message?.user;
  const channelId = message?.channel;
  
  // Parse the message text, removing the bot mention
  const text = message.text.replace(/<@[^>]+>/, '').trim();
  const args = text.split(' ').filter(arg => arg.length > 0);
  const subcommand = args[0] || '';

  try {
    switch (subcommand) {
      case 'hello':
        await handleHelloMention(client, channelId);
        break;
      case 'help':
        await handleHelpMention(client, channelId);
        break;
      case 'start':
        await handleStart(args.slice(1), channelId, userId, null, client);
        break;
      case 'status':
        await handleStatus(channelId, null, client);
        break;
      case 'present':
        await handlePresent(channelId, null, client);
        break;
      case 'summarize':
        await handleSummarize(args.slice(1), channelId, null, client);
        break;
      case 'reset':
        await handleReset(channelId, null, client);
        break;
      default:
        await client.chat.postMessage({
          channel: channelId,
          text: `❌ Unknown command: \`${subcommand}\`\nMention me with \`@retrobot help\` for available commands.`
        });
    }
  } catch (error) {
    console.error('Error handling mention:', error);
    await client.chat.postMessage({
      channel: channelId,
      text: `❌ ${error.message}`
    });
  }
}

module.exports = {
  handleSlashCommand: handleMention, // Keep old name for compatibility but use mention handler
  handleMention
};