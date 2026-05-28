import { metaVersion, requireEnv } from "./env.js";

const GRAPH_BASE = "https://graph.facebook.com";

export async function metaGet(path, params = {}) {
  return metaRequest(path, {
    method: "GET",
    params
  });
}

export async function metaPost(path, body = {}) {
  return metaRequest(path, {
    method: "POST",
    body
  });
}

export async function metaRequest(path, { method, params = {}, body } = {}) {
  const token = requireEnv("META_PAGE_ACCESS_TOKEN");
  const version = metaVersion();
  const url = new URL(`${GRAPH_BASE}/${version}/${stripSlash(path)}`);

  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Meta API request failed: ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  return data;
}

export async function getAdAccountInsights() {
  const accountId = requireEnv("META_AD_ACCOUNT_ID");
  const data = await metaGet(`${accountId}/insights`, {
    fields: "spend,impressions,clicks,reach,cpc,ctr",
    date_preset: "last_7d"
  });

  return data.data?.[0] || {
    spend: "0",
    impressions: "0",
    clicks: "0",
    reach: "0",
    cpc: "0",
    ctr: "0"
  };
}

export async function getAds() {
  const accountId = requireEnv("META_AD_ACCOUNT_ID");
  const data = await metaGet(`${accountId}/ads`, {
    fields: "id,name,status,effective_status,created_time,updated_time",
    limit: "25"
  });

  return data.data || [];
}

export async function updateAdStatus(adId, status) {
  if (!["ACTIVE", "PAUSED"].includes(status)) {
    const error = new Error("Only ACTIVE and PAUSED statuses are supported here");
    error.statusCode = 400;
    throw error;
  }

  return metaPost(adId, { status });
}

export async function updateAdFields(adId, fields) {
  return metaPost(adId, fields);
}

export async function getRecentComments() {
  const pageId = process.env.META_PAGE_ID;
  if (!pageId) {
    return [];
  }

  const posts = await metaGet(`${pageId}/posts`, {
    fields: "id,message,created_time",
    limit: "5"
  });

  const comments = [];
  for (const post of posts.data || []) {
    const commentData = await metaGet(`${post.id}/comments`, {
      fields: "id,message,from,created_time,permalink_url",
      order: "reverse_chronological",
      limit: "10"
    });
    comments.push(...(commentData.data || []));
  }

  return comments.slice(0, 25);
}

export async function sendMessengerReply(recipientId, text) {
  return metaPost("me/messages", {
    recipient: { id: recipientId },
    message: { text }
  });
}

export async function replyToComment(commentId, text) {
  return metaPost(`${commentId}/comments`, {
    message: text
  });
}

function stripSlash(path) {
  return String(path).replace(/^\/+/, "");
}
