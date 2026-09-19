import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Load messages with proper namespace structure
  const [
    commonMessages,
    authMessages,
    systemOwnersMessages,
    taxPayersMessages,
  ] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/system-owners.json`),
    import(`../../messages/${locale}/tax-payers.json`),
  ]);

  return {
    locale,
    messages: {
      common: commonMessages.default,
      auth: authMessages.default,
      "system-owners": systemOwnersMessages.default,
      "tax-payers": taxPayersMessages.default,
    },
  };
});
