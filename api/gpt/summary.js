import { requireGptActionAuth } from "../../lib/auth.js";
import { handleError, json, methodNotAllowed } from "../../lib/http.js";
import { getAdAccountInsights, getAds, getRecentComments, getRecentPosts } from "../../lib/meta.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  try {
    requireGptActionAuth(req);
    const [insights, posts, comments, ads] = await Promise.all([
      getAdAccountInsights(),
      getRecentPosts(),
      getRecentComments(),
      getAds()
    ]);

    return json(res, 200, { insights, posts, comments, ads });
  } catch (error) {
    return handleError(res, error);
  }
}
