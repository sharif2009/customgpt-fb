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
    fields: "id,name,status,effective_status,created_time,updated_time,creative{effective_object_story_id,object_story_id}",
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
  const pageId = requireEnv("META_PAGE_ID");
  const commentsById = new Map();

  await collectPagePostComments(pageId, commentsById);
  await collectAdStoryComments(commentsById);

  return [...commentsById.values()]
    .sort((a, b) => new Date(b.created_time || 0) - new Date(a.created_time || 0))
    .slice(0, 40);
}

export async function getRecentPosts() {
  const pageId = requireEnv("META_PAGE_ID");
  const postsById = new Map();

  await collectPosts(`${pageId}/feed`, postsById, "feed");
  await collectPosts(`${pageId}/posts`, postsById, "post");
  await collectAdStoryPosts(postsById);

  return [...postsById.values()]
    .sort((a, b) => new Date(b.created_time || 0) - new Date(a.created_time || 0))
    .slice(0, 40);
}

async function collectPosts(path, postsById, source) {
  const posts = await metaGet(path, {
    fields: "id,message,story,created_time,permalink_url,comments.summary(true).limit(0)",
    limit: "20"
  });

  for (const post of posts.data || []) {
    postsById.set(post.id, {
      ...post,
      source,
      comment_count: post.comments?.summary?.total_count || 0
    });
  }
}

async function collectAdStoryPosts(postsById) {
  const ads = await getAds();
  const storyIds = new Set();

  for (const ad of ads) {
    const storyId = ad.creative?.effective_object_story_id || ad.creative?.object_story_id;
    if (storyId) {
      storyIds.add(storyId);
    }
  }

  for (const storyId of storyIds) {
    const post = await metaGet(storyId, {
      fields: "id,message,story,created_time,permalink_url,comments.summary(true).limit(0)"
    });

    postsById.set(post.id, {
      ...post,
      source: "ad_story",
      comment_count: post.comments?.summary?.total_count || 0
    });
  }
}

async function collectPagePostComments(pageId, commentsById) {
  const feed = await metaGet(`${pageId}/feed`, {
    fields: "id,message,created_time,comments.limit(10).order(reverse_chronological){id,message,from,created_time,permalink_url}",
    limit: "10"
  });

  for (const post of feed.data || []) {
    addComments(commentsById, post.comments?.data || [], {
      source: "page_post",
      post_id: post.id,
      post_message: post.message || ""
    });
  }
}

async function collectAdStoryComments(commentsById) {
  const ads = await getAds();
  const storyIds = new Set();

  for (const ad of ads) {
    const storyId = ad.creative?.effective_object_story_id || ad.creative?.object_story_id;
    if (storyId) {
      storyIds.add(storyId);
    }
  }

  for (const storyId of storyIds) {
    const commentData = await metaGet(`${storyId}/comments`, {
      fields: "id,message,from,created_time,permalink_url",
      order: "reverse_chronological",
      limit: "10"
    });

    addComments(commentsById, commentData.data || [], {
      source: "ad_story",
      post_id: storyId
    });
  }
}

function addComments(commentsById, comments, meta) {
  for (const comment of comments) {
    if (!comment.id) {
      continue;
    }

    commentsById.set(comment.id, {
      ...comment,
      ...meta
    });
  }
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
