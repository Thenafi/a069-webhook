/**
 * Cloudflare Worker to handle Hostaway webhooks and post to Slack
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle GET requests for status checking
    if (request.method === "GET") {
      return handleGetRequest(url, env);
    }
    
    // Only handle POST requests for webhooks
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Parse the webhook payload
      const payload = await request.json();

      // Handle array of webhook events (as shown in the example)
      const webhooks = Array.isArray(payload) ? payload : [payload];

      for (const webhook of webhooks) {
        const eventType = webhook.body?.event;
        console.log(`Received webhook event: ${eventType}`);

        // Only process message.received events
        if (eventType === "message.received") {
          console.log("Processing message.received event");
          await handleMessageReceived(webhook.body, env);
        } else {
          console.log(`Ignoring event type: ${eventType}`);
        }
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

/**
 * Handle message.received webhook events
 */
async function handleMessageReceived(webhookData, env) {
  // Check if Slack notifications are enabled
  const isEnabled = env.SLACK_NOTIFICATIONS_ENABLED === "true";
  
  if (!isEnabled) {
    console.log("Slack notifications are DISABLED - skipping message");
    return;
  }
  
  console.log("Slack notifications are ENABLED - processing message");
  
  const { data } = webhookData;

  // Extract relevant information
  const messageBody = data.body;
  const conversationId = data.conversationId;
  const timezone = data.listingTimeZoneName;
  const messageDate = data.date;
  const attachments = data.attachments || [];
  const imageUrls = data.imagesUrls;

  // Check for attachments or URLs
  const hasAttachments = attachments.length > 0 || imageUrls;

  // Create conversation link
  const conversationLink = `https://dashboard.hostaway.com/v3/messages/inbox/${conversationId}`;

  // Format the Slack message
  const slackMessage = formatSlackMessage({
    messageBody,
    conversationId,
    timezone,
    messageDate,
    hasAttachments,
    conversationLink,
  });

  // Send to Slack
  await sendToSlack(slackMessage, env);
}

/**
 * Format the message for Slack
 */
function formatSlackMessage({
  messageBody,
  conversationId,
  timezone,
  messageDate,
  hasAttachments,
  conversationLink,
}) {
  let attachmentText = "";
  if (hasAttachments) {
    attachmentText = "\n📎 *This message contains attachments or URLs*";
  }

  return {
    text: `*New Message Received*

💬 *Message:* ${messageBody}

🌍 *Timezone:* ${timezone}
⏰ *Date:* ${messageDate}${attachmentText}

🔗 *View Conversation:* <${conversationLink}|Open in Hostaway Dashboard>`,
  };
}

/**
 * Send message to Slack using Web API
 */
async function sendToSlack(message, env) {
  const slackBotToken = env.SLACK_BOT_TOKEN;
  const slackChannel = env.SLACK_CHANNEL;

  if (!slackBotToken) {
    console.error("SLACK_BOT_TOKEN secret not set");
    return;
  }

  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: slackChannel,
        username: "A069 Message",
        text: message.text,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    console.log("Message sent to Slack successfully");
  } catch (error) {
    console.error("Error sending message to Slack:", error);
  }
}

/**
 * Handle GET requests for status
 */
function handleGetRequest(url, env) {
  const path = url.pathname;
  const isEnabled = env.SLACK_NOTIFICATIONS_ENABLED === "true";
  
  // Status endpoint
  if (path === "/status" || path === "/") {
    return new Response(JSON.stringify({
      service: "A069 Webhook Handler",
      status: "running",
      slack_notifications: isEnabled ? "enabled" : "disabled",
      channel: env.SLACK_CHANNEL,
      endpoints: {
        status: "/status",
        webhook: "/ (POST)"
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  return new Response("Not found", { status: 404 });
}
