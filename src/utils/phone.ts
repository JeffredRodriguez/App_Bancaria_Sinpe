export const PHONE_REQUIRED_LENGTH = 8;

export const sanitizePhoneInput = (value: string) =>
  value.replace(/\D/g, "").slice(0, PHONE_REQUIRED_LENGTH);

export const formatPhoneNumber = (value: string) => {
  const digits = sanitizePhoneInput(value);
  if (!digits) {
    return "";
  }
  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};
