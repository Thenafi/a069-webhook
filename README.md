# A069 Webhook - Hostaway to Slack Integration

This Cloudflare Worker receives webhooks from Hostaway and posts messages to a Slack channel when new messages are received.

## Features

- Filters for `message.received` events only
- Posts to Slack channel `C04SDEC0UHZ` with bot name "A069 Message"
- Includes message body, timezone, and timestamp
- Indicates if attachments or URLs are present
- Provides direct link to conversation in Hostaway Dashboard

## Setup

### 1. Create Slack Bot and Get Token

1. Go to https://api.slack.com/apps
2. Create a new app or use an existing one
3. Go to "OAuth & Permissions"
4. Add these Bot Token Scopes:
   - `chat:write` (to post messages)
   - `chat:write.customize` (to use custom username "A069 Message")
5. Install the app to your workspace
6. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
7. Invite the bot to channel `C04SDEC0UHZ`

### 2. Add Bot Token as Secret

The bot token is stored as a Cloudflare Worker secret (not in wrangler.toml for security):

```bash
wrangler secret put SLACK_BOT_TOKEN
# Enter your bot token when prompted (xoxb-...)
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy to Cloudflare Workers

```bash
npm run deploy
```

### 5. Get Worker URL

After deployment, Wrangler will show you the worker URL. Use this URL as your webhook endpoint in Hostaway.

## Control System (On/Off Switch)

### Check Status

Visit your worker URL to see current status:

```
https://your-worker.workers.dev/status
```

### Toggle Notifications

**Method 1: Environment Variable (Recommended)**

```bash
# To disable notifications
wrangler secret put SLACK_NOTIFICATIONS_ENABLED
# Enter: false

# To enable notifications
wrangler secret put SLACK_NOTIFICATIONS_ENABLED
# Enter: true
```

**Method 2: Update wrangler.toml and redeploy**

```toml
SLACK_NOTIFICATIONS_ENABLED = "false"  # or "true"
```

### Emergency Stop

Set `SLACK_NOTIFICATIONS_ENABLED = "false"` to immediately stop all Slack notifications while still accepting webhooks.

## Development

To run locally for testing:

```bash
npm run dev
```

## Webhook Payload

The worker expects Hostaway webhook payloads in this format:

```json
[
  {
    "body": {
      "event": "message.received",
      "data": {
        "body": "Message content",
        "conversationId": 12345,
        "listingTimeZoneName": "Australia/Sydney",
        "date": "2025-09-30 13:20:48",
        "attachments": [],
        "imagesUrls": null
      }
    }
  }
]
```

## Slack Message Format

The bot will post messages like:

```
**New Message Received**

💬 **Message:** Hi Jackson, thanks for your quick response! What would be the best price per month?

🌍 **Timezone:** Australia/Sydney
⏰ **Date:** 2025-09-30 13:20:48
📎 **This message contains attachments or URLs** (if applicable)

🔗 **View Conversation:** Open in Hostaway Dashboard
```
