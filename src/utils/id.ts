const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const createId = (prefix = "id"): string => {
  const random = Array.from(
    { length: 8 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};
