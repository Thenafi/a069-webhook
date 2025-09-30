# Deployment Steps

## Before Deployment

⚠️ **IMPORTANT**: You must set up your Slack bot token before deploying!

1. **Create Slack Bot**:

   - Go to https://api.slack.com/apps
   - Create new app or use existing one
   - Add scopes: `chat:write` and `chat:write.customize`
   - Install app to workspace
   - Copy the Bot User OAuth Token (starts with `xoxb-`)
   - Invite bot to channel `C04SDEC0UHZ`

2. **Add Bot Token as Secret**:

   ```bash
   wrangler secret put SLACK_BOT_TOKEN
   ```

   Enter your bot token when prompted

3. **Deploy**:
   ```bash
   npm run deploy
   ```

## After Deployment

1. Wrangler will show you the worker URL (e.g., `https://a069-webhook.your-subdomain.workers.dev`)
2. Use this URL as your webhook endpoint in Hostaway
3. Configure Hostaway to send **all webhook events** to this URL (unified webhook)

**Note**: The worker automatically filters and only processes `message.received` events. All other Hostaway events (like `reservation.created`, `message.sent`, etc.) will be received but ignored.

## Testing

You can test locally first:

```bash
npm run dev
```

Then send a test webhook payload to `http://localhost:8787`
