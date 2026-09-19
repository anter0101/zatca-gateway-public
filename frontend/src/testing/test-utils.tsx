import type { ReactElement, ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";

const defaultMessages: Record<string, string> = {
  "common.message.on-success": "Success",
  "common.message.on-error": "Error",
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

type AllTheProvidersProps = Readonly<{
  children: ReactNode;
  locale?: string;
  messages?: Record<string, string>;
  queryClient?: QueryClient;
}>;

function AllTheProviders({
  children,
  locale = "en",
  messages = defaultMessages,
  queryClient = createTestQueryClient(),
}: AllTheProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

type CustomRenderOptions = Omit<RenderOptions, "wrapper"> & {
  locale?: string;
  messages?: Record<string, string>;
  queryClient?: QueryClient;
};

function renderWithProviders(
  ui: ReactElement,
  { locale, messages, queryClient, ...renderOptions }: CustomRenderOptions = {},
) {
  const client = queryClient ?? createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AllTheProviders locale={locale} messages={messages} queryClient={client}>
        {children}
      </AllTheProviders>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: client,
  };
}

export { createTestQueryClient, renderWithProviders };
