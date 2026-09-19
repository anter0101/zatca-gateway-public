# Agent Rules (Antigravity)

Instructions for AI assistants working in this codebase. The project follows [bulletproof-react](https://github.com/alan2207/bulletproof-react) design patterns adapted for Next.js App Router.

## Architecture

- **Component-based structure** — UI components organized in `src/components/` by domain (e.g., `auth/`, `layout/`, `common/`, `ui/`).
- **Feature-based structure for complex domains** — For larger, isolated features, use `src/features/[feature-name]/` with subfolders: `api/`, `components/`, `hooks/`, `types/` as needed.
- **Shared code** — Reusable hooks in `src/hooks/` organized by domain. Shared types in `src/types/`. Shared utilities in `src/lib/` and `src/utils/`.
- **Unidirectional flow** — `app/` composes components and features; features/components do not import from `app/` or from other features.
- **Imports** — Use `@/` absolute imports. Prefer direct imports over barrel files.

See `.cursor/rules/architecture.mdc` for the full folder layout.

## Components

- Colocate component files with their tests; use kebab-case for file and folder names.
- Do not use nested render functions; extract sub-UI into separate components.
- Limit component props; use composition (children/slots) when a component grows too many props.
- Shared/base UI lives in `components/ui/`; follow existing patterns (Radix + Tailwind, `cn()` for class names).

See `.cursor/rules/components.mdc`.

## API and Data

- Use the single Axios client from `@/lib/client`.
- For new endpoints: define types/schemas (Zod when possible), a query key factory, a fetcher function, and a TanStack Query hook in `features/[feature]/api/` or reuse `hooks/base/` (e.g. `useCreate`, `useGetAll`).
- Server state stays in TanStack Query; do not put fetched data in React Context.

See `.cursor/rules/api-layer.mdc`.

## State

- **Component state** — `useState` / `useReducer` locally.
- **Application state** — React Context in `contexts/` (e.g. selection, form mode).
- **Server cache** — TanStack Query only.
- **Forms** — React Hook Form + Zod.
- **URL state** — Next.js `searchParams` / `useRouter` for shareable state.

See `.cursor/rules/state-management.mdc`.

## Testing

- Add tests for new features: unit tests for utils/hooks, integration tests for components (with mocked API).
- Use `renderWithProviders` from `@/testing/test-utils` so components get QueryClient, Intl, etc.
- Prefer MSW for API mocking; put handlers in `src/testing/mocks/handlers/`.
- Test behavior and output (roles, labels, text), not implementation details.

See `.cursor/rules/testing.mdc`.

## Conventions

- **Naming** — kebab-case for files and folders (except `__tests__`). PascalCase for components.
- **Types** — Use `type` for props and shared types; use `interface` only when extending or declaring contracts that need it.
- **Linting** — Respect ESLint and existing rules (e.g. `simple-import-sort`, `@typescript-eslint/consistent-type-imports`).

When adding or refactoring code, follow the rules in `.cursor/rules/` and keep this document in mind so the codebase stays consistent and maintainable.
