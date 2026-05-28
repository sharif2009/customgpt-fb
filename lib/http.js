export function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res) {
  json(res, 405, { error: "Method not allowed" });
}

export function handleError(res, error) {
  const statusCode = error.statusCode || 500;
  json(res, statusCode, {
    error: error.message || "Unexpected server error"
  });
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
