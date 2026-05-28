import { handleError, json, methodNotAllowed } from "../../lib/http.js";
import { getAdAccountInsights, getAds, getRecentComments, getRecentPosts } from "../../lib/meta.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  try {
    const [insights, posts, comments, ads] = await Promise.all([
      getAdAccountInsights(),
      getRecentPosts(),
      getRecentComments(),
      getAds()
    ]);

    return json(res, 200, {
      insights,
      posts: posts.slice(0, 8).map(compactPost),
      comments: comments.slice(0, 12).map(compactComment),
      ads: ads.slice(0, 12).map(compactAd)
    });
  } catch (error) {
    return handleError(res, error);
  }
}

function compactPost(post) {
  return {
    id: post.id,
    text: truncate(post.message || post.story || "Untitled post", 260),
    created_time: post.created_time,
    comment_count: post.comment_count || 0,
    source: post.source
  };
}

function compactComment(comment) {
  return {
    comment_id_for_reply: comment.id,
    parent_post_id: comment.post_id,
    from: comment.from?.name || "Facebook User",
    text: truncate(comment.message || "No message text", 180),
    created_time: comment.created_time,
    source: comment.source
  };
}

function compactAd(ad) {
  return {
    id: ad.id,
    name: truncate(ad.name || ad.id, 140),
    status: ad.status,
    effective_status: ad.effective_status,
    updated_time: ad.updated_time
  };
}

function truncate(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}
