import { handleError, json, readJson } from "../lib/http.js";
import { generateBusinessReply } from "../lib/openai.js";
import { replyToComment, sendMessengerReply } from "../lib/meta.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return verifyWebhook(req, res);
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readJson(req);
    await handleWebhookBody(body);
    return json(res, 200, { ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}

function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    res.statusCode = 200;
    return res.end(challenge);
  }

  return json(res, 403, { error: "Webhook verification failed" });
}

async function handleWebhookBody(body) {
  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      await handleMessagingEvent(event);
    }

    for (const change of entry.changes || []) {
      await handlePageChange(change);
    }
  }
}

async function handleMessagingEvent(event) {
  const text = event.message?.text;
  const senderId = event.sender?.id;

  if (!text || !senderId) {
    return;
  }

  const reply = await generateBusinessReply({ message: text });
  await sendMessengerReply(senderId, reply);
}

async function handlePageChange(change) {
  if (change.field !== "feed") {
    return;
  }

  const value = change.value || {};
  if (value.item !== "comment" || value.verb !== "add" || !value.comment_id) {
    return;
  }

  const message = value.message || "";
  const reply = await generateBusinessReply({ message });
  await replyToComment(value.comment_id, reply);
}
