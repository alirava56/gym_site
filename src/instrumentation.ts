export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const required = ["DATABASE_URL", "AUTH_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD_HASH"] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  if ((process.env.AUTH_SECRET?.length ?? 0) < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
}
