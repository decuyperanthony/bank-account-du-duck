/**
 * Authentification "maison" volontairement simple : un seul code PIN
 * partagé (pas de table users), un cookie de session signé en HMAC pour
 * éviter qu'on puisse juste poser un cookie "authentifié=true" à la main.
 * Pas de rotation, pas d'expiration applicative, pas de rate-limiting :
 * suffisant pour un usage perso, pas fait pour protéger des données
 * sensibles à grande échelle.
 */

export const SESSION_COOKIE = "duck_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

const SESSION_PAYLOAD = "authenticated";

const getSecret = () => process.env.APP_PIN_SECRET ?? process.env.APP_PIN ?? "";

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const sign = async (value: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return toHex(signature);
};

export const createSessionValue = async () =>
  `${SESSION_PAYLOAD}.${await sign(SESSION_PAYLOAD)}`;

export const isValidSessionValue = async (
  value: string | undefined | null
) => {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  return signature === (await sign(payload));
};

export const checkPin = (pin: string) => {
  const expected = process.env.APP_PIN;
  return Boolean(expected) && pin === expected;
};
