import { handleError, json, methodNotAllowed, readJson } from "../../../../lib/http.js";
import { replyToComment } from "../../../../lib/meta.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  try {
    const { commentId } = req.query;
    const { message } = await readJson(req);

    if (!message || typeof message !== "string") {
      return json(res, 400, { error: "message is required" });
    }

    const result = await replyToComment(commentId, message);
    return json(res, 200, { ok: true, result });
  } catch (error) {
    return handleError(res, error);
  }
}
