# retrobot Setup Instructions

## Prerequisites

- Node.js 16+ installed
- **Slack workspace admin permissions** (required to create and install apps)
- Ability to deploy/run Node.js applications

## Admin Configuration (Slack App Setup)

> ⚠️ **Admin Required**: The following steps require Slack workspace admin permissions.

### 1. Create Slack App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Give it a name (e.g., "retrobot") and select your workspace
4. Click **"Create App"**

### 2. Enable Socket Mode

1. Go to **Socket Mode** → Toggle **"Enable Socket Mode"** ON
2. Click **"Generate an app token"**
3. Name it "retrobot-socket" and add these **App-Level Token Scopes**:
   - `connections:write` - Connect to Slack via WebSocket
   - `authorizations:read` - Verify app installation
4. Click **"Generate"** and copy the **App Token** (starts with `xapp-`)

### 3. Configure Bot Permissions

Go to **OAuth & Permissions** and add these **Bot Token Scopes**:

**Core functionality (required):**
- `channels:read` - Read basic channel information  
- `channels:history` - Access channel member lists via conversations.members API
- `channels:join` - Join public channels when invited with `/invite @retrobot`
- `groups:read` - Access private channels when invited
- `mpim:read` - Access multi-party DMs when invited
- `im:read` - Access direct message conversations
- `im:write` - Send direct messages to collect responses
- `users:read` - Get user information to filter out bots
- `chat:write` - Send messages to channels and DMs

**Voting functionality (required):**
- `reactions:read` - Count emoji vote reactions for summarizing
- `reactions:write` - Add initial reaction options (👍🔥📈) to responses

### 4. Enable Events (for mentions and DMs)

1. Go to **Event Subscriptions** → Toggle **"Enable Events"** ON
2. Under **Subscribe to bot events**, add these events:
   - `message.channels` - Handle @retrobot mentions in public channels
   - `message.groups` - Handle @retrobot mentions in private channels
   - `message.im` - Handle direct message conversations

### 5. Enable App Home (for DMs)

1. Go to **App Home** in your app settings
2. Under **"Show Tabs"** section:
   - Enable **"Messages Tab"**
   - Check **"Allow users to send Slash commands and messages from the messages tab"**

### 6. Install App to Workspace

1. Go to **OAuth & Permissions** → Click **"Install to Workspace"**
2. Review and authorize the requested permissions
3. Copy the **"Bot User OAuth Token"** (starts with `xoxb-`)

---

## Application Setup

### 6. Clone and Install Code

```bash
git clone <repository-url>
cd retrobot
npm install
```

### 7. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your tokens from the Slack app:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_APP_TOKEN=xapp-your-app-token-here
   ```

### 8. Run the Application

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

You should see: `⚡️ retrobot is running`

---

## Usage

### 9. Invite Bot to Channels

In any Slack channel where you want to run retrospectives:
```
/invite @retrobot
```

### 10. Test the Bot

Try mentioning the bot:
```
@retrobot hello
```

### 11. Start Your First Retrospective

```
@retrobot start retrospective
```

## Local Development

No web server setup needed! Socket Mode connects directly to Slack via WebSocket. Just run:

```bash
npm run dev
```

## Production Deployment

For production, deploy to any Node.js hosting service:
- Heroku
- Railway  
- DigitalOcean App Platform
- AWS ECS/Fargate
- Google Cloud Run

No public URL or webhooks needed with Socket Mode! Just set the environment variables.

## Troubleshooting

### Common Issues

**❌ Bot not responding to @mentions**
- ✅ Verify **Event Subscriptions** are enabled with `message.channels` and `message.groups`
- ✅ Check bot is invited to the channel: `/invite @retrobot`
- ✅ Ensure all **Bot Token Scopes** are added (11 total scopes required)

**❌ Socket connection issues**  
- ✅ Check `SLACK_APP_TOKEN` starts with `xapp-` and is correct
- ✅ Verify **Socket Mode** is enabled in Slack app settings
- ✅ Confirm **App-Level Token** has `connections:write` and `authorizations:read` scopes

**❌ DMs not working**
- ✅ Verify `im:write` and `im:read` bot token scopes are enabled
- ✅ Check `message.im` event subscription is added
- ✅ **Enable "Messages Tab" in App Home settings** (most common issue)
- ✅ Check "Allow users to send Slash commands and messages from the messages tab"
- ✅ Confirm users haven't disabled DMs from apps in their Slack settings

**❌ Permission/scope errors**
- ✅ Reinstall app to workspace after adding new scopes
- ✅ Verify all 11 bot token scopes are present (see step 3)
- ✅ Check `conversations.members` API requires `channels:history` scope

**❌ Can't get channel members**
- ✅ Bot needs `channels:read`, `channels:history`, `groups:read` scopes
- ✅ Bot must be invited to the channel first
- ✅ For private channels, ensure `groups:read` scope is enabled

### Quick Scope Checklist

Run this checklist if you're having permission issues:

```
☐ channels:read
☐ channels:history  
☐ channels:join
☐ groups:read
☐ mpim:read
☐ im:read
☐ im:write
☐ users:read
☐ chat:write
☐ reactions:read
☐ reactions:write
```

**All 11 scopes must be enabled for full functionality.**