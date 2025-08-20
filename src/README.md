# retrobot - Codebase Structure

This is a Slack bot for running retrospective sessions. The codebase is organized into focused modules for easy understanding and modification.

## Directory Structure

```
src/
├── index.js                 # Application entry point
├── slack.js                 # Slack app configuration
├── managers/
│   ├── SessionManager.js   # Session state management
│   └── DMStateManager.js   # DM conversation state
├── handlers/
│   ├── commands.js         # Command handlers
│   ├── messages.js         # DM message handlers
│   └── actions.js          # Button interaction handlers
└── services/
    ├── slack.js           # Slack API utilities
    ├── voting.js          # Voting/presentation logic
    └── dm.js              # DM messaging functions
```

## Module Responsibilities

### **index.js**
Application entry point that:
- Loads environment variables
- Registers event handlers for messages, mentions, and actions
- Starts the Slack app

### **slack.js**
Slack app configuration that:
- Initializes the Slack Bolt app with tokens
- Configures socket mode for real-time communication
- Sets up connection parameters (ping/pong intervals)

### **managers/**

#### **SessionManager.js**
Manages retrospective sessions by:
- Storing session state (questions, responses, participants)
- Defining question sets (retrospective, team-check-in, project-review)
- Tracking which users have completed responses
- Managing anonymous vs. named sessions

#### **DMStateManager.js**
Manages individual user conversations by:
- Tracking which question each user is currently answering
- Storing user responses as they're collected
- Managing conversation flow through questions
- Handling user restarts and state cleanup

### **handlers/**

#### **commands.js**
Processes bot commands and mentions by:
- Parsing command arguments (question sets, flags, options)
- Starting new retrospective sessions
- Manually presenting responses for voting
- Summarizing vote results
- Resetting/canceling sessions
- Providing help information

#### **messages.js**
Handles direct message interactions by:
- Processing user responses to retrospective questions
- Managing conversation flow between questions
- Coordinating with SessionManager to store responses
- Auto-presenting responses when all users complete

#### **actions.js**
Handles button interactions by:
- Processing "start over" button clicks in DMs
- Resetting user state to allow re-answering questions

### **services/**

#### **slack.js**
Provides Slack API utilities for:
- Fetching channel member lists
- Safely sending direct messages (handling failures gracefully)
- Managing Slack API calls with error handling

#### **voting.js**
Manages response presentation and voting by:
- Formatting responses for voting (with or without attribution)
- Auto-presenting when all participants complete
- Manually presenting on command
- Counting and summarizing votes
- Generating top-voted summaries

#### **dm.js**
Handles direct message formatting by:
- Sending initial retrospective questions to users
- Sending follow-up questions in sequence
- Providing "start over" buttons for user convenience
- Formatting messages consistently

## Modifying the Bot

### Adding New Question Sets
Edit `managers/SessionManager.js` to add new question sets in the `questionSets` object.

### Adding New Commands
Add new command handlers in `handlers/commands.js` and register them in the command parsing logic.

### Customizing DM Flow
Modify `handlers/messages.js` to change how users progress through questions or add new conversation patterns.

### Adding New Services
Create new files in `services/` for additional functionality like integrations, notifications, or data storage.