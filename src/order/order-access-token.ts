import { randomBytes, timingSafeEqual } from "crypto";

export const generateOrderAccessToken = (): string => randomBytes(32).toString("hex");

export const accessTokensMatch = (provided: string, stored: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  const storedBuffer = Buffer.from(stored);
  if (providedBuffer.length !== storedBuffer.length) {
    return false;
  }
  return timingSafeEqual(providedBuffer, storedBuffer);
};
