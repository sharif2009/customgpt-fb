import { handleError, json, methodNotAllowed, readJson } from "../../lib/http.js";
import { updateAdFields, updateAdStatus } from "../../lib/meta.js";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return methodNotAllowed(res);
  }

  try {
    const { adId } = req.query;
    const body = await readJson(req);
    const result = body.status
      ? await updateAdStatus(adId, body.status)
      : await updateAdFields(adId, body);

    return json(res, 200, { ok: true, result });
  } catch (error) {
    return handleError(res, error);
  }
}
