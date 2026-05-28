export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Missing environment variable: ${name}`);
    error.statusCode = 500;
    throw error;
  }
  return value;
}

export function metaVersion() {
  return process.env.META_API_VERSION || "v20.0";
}
