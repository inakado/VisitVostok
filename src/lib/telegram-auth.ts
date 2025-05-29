import crypto from "crypto";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export function verifyTelegramPayload(payload: Record<string, string>) {
  const hash = payload.hash;
  const authData = { ...payload };
  delete authData.hash;

  const sorted = Object.keys(authData)
    .sort()
    .map((key) => `${key}=${authData[key]}`)
    .join("\n");

  const secret = crypto
    .createHash("sha256")
    .update(TELEGRAM_BOT_TOKEN)
    .digest();

  const signature = crypto
    .createHmac("sha256", secret)
    .update(sorted)
    .digest("hex");

  return signature === hash;
}