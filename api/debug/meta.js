import { handleError, json, methodNotAllowed } from "../../lib/http.js";
import { metaGet } from "../../lib/meta.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  try {
    const token = process.env.META_PAGE_ACCESS_TOKEN || "";
    const pageId = process.env.META_PAGE_ID || "";
    const me = await metaGet("me", {
      fields: "id,name"
    });

    let feed = null;
    let feedError = null;

    try {
      feed = await metaGet(`${pageId}/feed`, {
        fields: "id,message,created_time",
        limit: "1"
      });
    } catch (error) {
      feedError = error.message;
    }

    return json(res, 200, {
      me,
      page_id_env: pageId,
      token_length: token.length,
      token_prefix: token.slice(0, 8),
      token_suffix: token.slice(-6),
      feed_ok: Boolean(feed),
      feed_count: feed?.data?.length || 0,
      feed_error: feedError
    });
  } catch (error) {
    return handleError(res, error);
  }
}
