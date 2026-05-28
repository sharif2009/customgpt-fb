export function requireGptActionAuth(req) {
  const secret = process.env.GPT_ACTION_SECRET;
  if (!secret) {
    const error = new Error("Missing environment variable: GPT_ACTION_SECRET");
    error.statusCode = 500;
    throw error;
  }

  const headerSecret = req.headers["x-gpt-action-secret"];
  const auth = req.headers.authorization || "";
  const bearerSecret = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";

  if (headerSecret === secret || bearerSecret === secret) {
    return;
  }

  const error = new Error("Unauthorized GPT action request");
  error.statusCode = 401;
  throw error;
}
