import { handleError, json, methodNotAllowed } from "../../lib/http.js";
import { getAdAccountInsights, getRecentComments } from "../../lib/meta.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  try {
    const [insights, comments] = await Promise.all([
      getAdAccountInsights(),
      getRecentComments()
    ]);

    return json(res, 200, { insights, comments });
  } catch (error) {
    return handleError(res, error);
  }
}
