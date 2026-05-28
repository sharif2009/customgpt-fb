import { handleError, json, methodNotAllowed } from "../../lib/http.js";
import { getAdAccountInsights, getRecentComments, getRecentPosts } from "../../lib/meta.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  try {
    const [insights, comments, posts] = await Promise.all([
      getAdAccountInsights(),
      getRecentComments(),
      getRecentPosts()
    ]);

    return json(res, 200, { insights, comments, posts });
  } catch (error) {
    return handleError(res, error);
  }
}
