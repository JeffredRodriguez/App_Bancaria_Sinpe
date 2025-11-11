export const sanitizeAmountInput = (value: string) => {
  const cleaned = value.replace(/[^0-9.,]/g, "");
  if (!cleaned) {
    return "";
  }

  const dotCount = (cleaned.match(/\./g) ?? []).length;
  const commaCount = (cleaned.match(/,/g) ?? []).length;
  let decimalSeparator: "." | "," | null = null;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      const decimalsCount = cleaned.length - lastComma - 1;
      if (decimalsCount > 0 && decimalsCount <= 2) {
        decimalSeparator = ",";
      }
    }
    if (!decimalSeparator) {
      const decimalsCount = cleaned.length - lastDot - 1;
      if (decimalsCount > 0 && decimalsCount <= 2) {
        decimalSeparator = ".";
      }
    }
  } else if (commaCount === 1) {
    const lastComma = cleaned.lastIndexOf(",");
    const decimalsCount = cleaned.length - lastComma - 1;
    if (decimalsCount > 0 && decimalsCount <= 2) {
      decimalSeparator = ",";
    }
  } else if (dotCount === 1) {
    const lastDot = cleaned.lastIndexOf(".");
    const decimalsCount = cleaned.length - lastDot - 1;
    if (decimalsCount > 0 && decimalsCount <= 2) {
      decimalSeparator = ".";
    }
  }

  let normalized: string;
  if (decimalSeparator === ",") {
    normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else if (decimalSeparator === ".") {
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned.replace(/[.,]/g, "");
  }

  const [rawInteger = "", rawDecimals = ""] = normalized.split(".");
  const integerDigits = rawInteger.replace(/^0+(?=\d)/, "");
  const decimals = rawDecimals.slice(0, 2);
  const hasDecimals = decimals.length > 0;
  const integerPart = integerDigits || (hasDecimals ? "0" : "");

  if (!integerPart && !hasDecimals) {
    return "";
  }

  return hasDecimals ? `${integerPart}.${decimals}` : integerPart;
};

export const formatAmountDisplay = (raw: string) => {
  if (!raw) {
    return "";
  }
  const [integerPartRaw, decimalsRaw] = raw.split(".");
  const integerPart = integerPartRaw || "0";
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimals = decimalsRaw ? `,${decimalsRaw}` : "";
  return `₡${formattedInteger}${decimals}`;
};

export const parseAmountToNumber = (raw: string) => {
  if (!raw) {
    return NaN;
  }
  return Number(raw);
};
