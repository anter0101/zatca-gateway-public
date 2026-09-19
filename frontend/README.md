# ZATCA Gateway - Frontend

A modern Next.js application for the ZATCA Gateway system, built with TypeScript, React, and Tailwind CSS.

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [Development Guidelines](#-development-guidelines)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Contributing](#-contributing)

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: 
  - Server State: [TanStack Query](https://tanstack.com/query)
  - Application State: React Context
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Testing**: [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/react)
- **Linting**: [ESLint](https://eslint.org/) + [TypeScript ESLint](https://typescript-eslint.io/)

## 📁 Project Structure

The project follows a **component-based architecture** with domain-organized folders:

```
frontend/
├── public/                     # Static assets
│   └── assets/
│       └── images/            # Images and icons
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── [locale]/         # Internationalized routes
│   │   │   ├── (auth)/       # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   └── (loggedIn)/   # Protected application pages
│   │   │       └── page.tsx  # Dashboard/Home
│   │   ├── api/              # API routes
│   │   │   └── auth/         # Authentication endpoints
│   │   └── favicon.ico
│   │
│   ├── components/           # UI Components (organized by domain)
│   │   ├── auth/            # Authentication components
│   │   │   ├── login-form/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── common/          # Shared components
│   │   │   ├── action-confirmation-dialog.tsx
│   │   │   ├── delete-confirmation-form.tsx
│   │   │   ├── infinite-scroll-trigger.tsx
│   │   │   ├── language-switcher.tsx
│   │   │   ├── table-pagination.tsx
│   │   │   └── theme-btn.tsx
│   │   ├── layout/          # Layout components
│   │   │   └── header/
│   │   ├── providers/       # Context providers
│   │   │   ├── auth-token.tsx
│   │   │   ├── main.tsx
│   │   │   └── shadcn.tsx
│   │   └── ui/             # Base UI components (shadcn)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── form.tsx
│   │       └── ...
│   │
│   ├── hooks/              # Custom React Hooks (organized by domain)
│   │   ├── auth/          # Authentication hooks
│   │   │   ├── login.ts
│   │   │   ├── forget-password.ts
│   │   │   ├── reset-password.ts
│   │   │   └── index.ts
│   │   ├── base/          # Base CRUD hooks
│   │   │   ├── create.ts
│   │   │   ├── delete.ts
│   │   │   ├── get-all.ts
│   │   │   ├── get-one.ts
│   │   │   ├── get-paginated.ts
│   │   │   └── put.ts
│   │   └── use-pagination.ts
│   │
│   ├── lib/               # Library configurations
│   │   ├── authentication/
│   │   │   ├── auth.ts       # NextAuth instance
│   │   │   └── auth.config.ts # NextAuth configuration
│   │   ├── client.ts          # Axios client instance
│   │   └── query-client.ts    # TanStack Query client
│   │
│   ├── types/             # TypeScript type definitions (organized by domain)
│   │   ├── auth/         # Authentication types
│   │   │   ├── user.ts
│   │   │   └── index.ts
│   │   ├── api-res-error.ts
│   │   ├── api-res-success.ts
│   │   ├── common.ts
│   │   ├── query-params.ts
│   │   ├── types.ts
│   │   └── next-auth.d.ts     # NextAuth type extensions
│   │
│   ├── utils/             # Utility functions
│   │   ├── base-metadata.ts
│   │   ├── countdown.ts
│   │   ├── css-classes-merge.ts
│   │   ├── get-translated-key.ts
│   │   ├── images.ts
│   │   └── selection-params.ts
│   │
│   ├── i18n/              # Internationalization
│   │   ├── i18n-helpers.ts
│   │   ├── navigation.ts
│   │   ├── request.ts
│   │   └── routing.ts
│   │
│   ├── styles/            # Global styles
│   │   ├── fonts/        # Custom fonts (Cairo)
│   │   └── globals.css   # Global CSS + Tailwind
│   │
│   ├── testing/           # Testing utilities
│   │   ├── mocks/
│   │   │   └── handlers/ # MSW handlers
│   │   └── test-utils.tsx
│   │
│   ├── enums/             # Enumerations
│   │   ├── icons.ts
│   │   ├── system-item.ts
│   │   └── views.ts
│   │
│   └── middleware.ts      # Next.js middleware (auth, i18n)
│
├── messages/              # i18n translation files
│   ├── ar/               # Arabic translations
│   │   ├── auth.json
│   │   └── common.json
│   └── en/               # English translations
│       ├── auth.json
│       └── common.json
│
├── .cursor/              # Cursor IDE rules
│   └── rules/
│
├── .env                  # Environment variables (production)
├── .env.example          # Environment variables template
├── .env.local            # Local environment overrides (not in git)
├── .gitignore
├── components.json       # shadcn/ui configuration
├── eslint.config.mjs     # ESLint configuration
├── jest.config.ts        # Jest configuration
├── jest.setup.ts         # Jest setup
├── next.config.ts        # Next.js configuration
├── package.json
├── postcss.config.mjs    # PostCSS configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── AGENTS.md             # AI Agent rules
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm (recommended) or npm
- Backend API running (see backend documentation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zatca-gateway/frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and update the values:
   ```env
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
```

## 🏗 Architecture

### Component-Based Organization

The project uses a **component-based architecture** where code is organized by domain rather than by technical type:

- **`components/auth/`** - All authentication UI components
- **`hooks/auth/`** - All authentication-related hooks
- **`types/auth/`** - All authentication-related types

This approach provides:
- **Better discoverability** - Related code is grouped together
- **Easier maintenance** - Changes to a feature affect files in one area
- **Clear boundaries** - Each domain is self-contained
- **Better scalability** - Easy to add new domains without complex folder structures

### Key Architectural Principles

1. **Unidirectional Data Flow**
   - `app/` composes components
   - Components don't import from `app/` or other domain components
   - Shared code lives in `components/common/`, `hooks/`, `lib/`, `utils/`

2. **Server State Management**
   - All server data is managed by TanStack Query
   - No server data in React Context
   - Base CRUD hooks in `hooks/base/` for consistency

3. **Type Safety**
   - Zod schemas for validation and type inference
   - Strict TypeScript configuration
   - Type-safe API responses

4. **Internationalization**
   - All user-facing text uses `next-intl`
   - Translation files in `messages/[locale]/`
   - RTL support for Arabic

5. **Testing Strategy**
   - Unit tests for utilities and hooks
   - Integration tests for components
   - MSW for API mocking
   - Test files colocated with source files

## 💻 Development Guidelines

### Adding a New Component

1. Create a new folder in the appropriate domain (e.g., `components/auth/`)
2. Add an `index.tsx` file for the component
3. Export from the domain's `index.ts` if needed
4. Colocate tests in the same folder

Example:
```typescript
// components/auth/new-component/index.tsx
export default function NewComponent() {
  // Component code
}

// components/auth/new-component/new-component.test.tsx
import NewComponent from './index';
// Test code
```

### Adding a New Hook

1. Create a new file in the appropriate domain (e.g., `hooks/auth/`)
2. Export the hook and any related types
3. Add to the domain's `index.ts` for easier imports

Example:
```typescript
// hooks/auth/use-something.ts
export const useSomething = () => {
  // Hook code
};

// hooks/auth/index.ts
export { useSomething } from './use-something';
```

### API Integration

Use the base hooks for standard CRUD operations:

```typescript
import { useCreate, useGetAll, usePut, useDelete } from '@/hooks/base';

// In your component
const { mutate, isPending } = useCreate({
  endPoint: '/api/your-endpoint',
  queryKey: ['your-key'],
  onSuccess: () => {
    toast.success('Success!');
  },
});
```

### Styling

- Use Tailwind CSS utility classes
- Use `cn()` helper for conditional classes
- Follow existing component patterns from `components/ui/`
- Support RTL for Arabic locale

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption | Yes |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL | Yes |
| `NEXT_PUBLIC_APP_URL` | Frontend application URL | Yes |

**Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Variables without `NEXT_PUBLIC_` are server-side only
- Use `.env.local` for local overrides (not committed to git)

## 🧪 Testing

### Running Tests

```bash
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm test:coverage     # Run tests with coverage
```

### Writing Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/testing/test-utils';
import YourComponent from './index';

describe('YourComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Test Organization

- Colocate test files with source files
- Use `*.test.tsx` or `*.test.ts` naming
- Mock API calls using MSW handlers in `src/testing/mocks/handlers/`
- Use `renderWithProviders` for components that need QueryClient/Intl

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Use kebab-case for file and folder names
3. Write tests for new features
4. Update documentation when adding new features
5. Follow the ESLint rules (auto-fixable with `pnpm lint --fix`)

### Code Style

- **Imports**: Use absolute imports with `@/` prefix
- **Naming**: 
  - PascalCase for components
  - camelCase for functions and variables
  - kebab-case for files and folders
- **Types**: Prefer `type` over `interface` unless extending
- **Exports**: Prefer named exports, use default for components

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [next-intl Documentation](https://next-intl-docs.vercel.app)

## 📄 License

[Add your license information here]

## 👥 Team

[Add team information here]
