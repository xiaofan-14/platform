import crypto from "node:crypto";

const SALT_LENGTH = 12;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;
const DIGEST = "sha256";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  ).toString("hex");
  return `${salt}:${hash}`;
}