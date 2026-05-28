import { handleError, json, methodNotAllowed } from "../../lib/http.js";
import { getAds } from "../../lib/meta.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  try {
    return json(res, 200, { ads: await getAds() });
  } catch (error) {
    return handleError(res, error);
  }
}
