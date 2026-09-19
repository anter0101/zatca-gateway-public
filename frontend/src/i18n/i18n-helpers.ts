import { getMessages } from "next-intl/server";

/**
 * Enhanced function that handles both single and multiple namespaces
 *
 * @param locale - The locale to load messages for
 * @param namespaces - Single namespace string or array of namespace strings
 * @returns Messages object or single namespace messages
 *
 * @example
 * // Single namespace
 * const authMessages = await getLocaleMessages(locale, "auth");
 *
 * // Multiple namespaces
 * const messages = await getLocaleMessages(locale, ["auth", "common"]);
 *
 * // Returns: { auth: {...}, common: {...} }
 */
export async function getLocaleMessages(
  locale: string,
  namespaces: string | string[],
) {
  // Convert single namespace to array for consistent handling
  const namespaceArray = Array.isArray(namespaces) ? namespaces : [namespaces];

  try {
    const namespacePromises = namespaceArray.map(async (namespace) => {
      const messages = await import(
        `../../messages/${locale}/${namespace}.json`
      );
      return { [namespace]: messages.default };
    });

    const namespaceResults = await Promise.all(namespacePromises);

    const result = namespaceResults.reduce((acc, result) => {
      return { ...acc, ...result };
    }, {});

    // If single namespace was requested, return just that namespace's messages
    if (!Array.isArray(namespaces)) {
      return result[namespaces];
    }

    return result;
  } catch (error) {
    console.error(`Failed to load namespaces for locale ${locale}:`, error);
    throw new Error(`Failed to load namespaces: ${namespaceArray.join(", ")}`);
  }
}

// Load all messages (fallback for when you need everything)
export async function getAllMessages(locale: string) {
  return getMessages({ locale });
}
