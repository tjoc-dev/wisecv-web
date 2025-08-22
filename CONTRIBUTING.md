# Contributing to WiseCV Web

We love your input! We want to make contributing to WiseCV Web as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. **Fork the repo** and create your branch from `main`.
2. **Install dependencies** with `pnpm install`.
3. **Make your changes** following our coding standards.
4. **Add tests** if you've added code that should be tested.
5. **Update documentation** if you've changed APIs.
6. **Ensure the test suite passes** with `pnpm test`.
7. **Make sure your code lints** with `pnpm lint`.
8. **Issue that pull request**!

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git

### Local Development

1. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/wisecv-web.git
   cd wisecv-web
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local configuration
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   ```
   http://localhost:8080
   ```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test LoginForm.test.tsx
```

### Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm type-check
```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Avoid `any` types - use proper typing
- Use interfaces for props and state
- Use type assertions sparingly
- Document complex types with JSDoc

### React Components

- Use functional components with hooks
- Follow the single responsibility principle
- Use meaningful component and prop names
- Implement proper error boundaries
- Use React.memo for performance optimization when needed

### Code Style

- Use ESLint and Prettier configurations
- Use meaningful variable and function names
- Keep functions small and focused
- Use async/await over Promises
- Handle errors appropriately

### Component Structure

```tsx
// 1. Imports (React, third-party, local)
import React from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

// 2. Types/Interfaces
interface ComponentProps {
  title: string
  onSubmit: (data: FormData) => void
}

// 3. Component
export function Component({ title, onSubmit }: ComponentProps) {
  // 4. Hooks
  const { user } = useAuth()
  
  // 5. Event handlers
  const handleSubmit = (data: FormData) => {
    onSubmit(data)
  }
  
  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
      {/* Component JSX */}
    </div>
  )
}
```

### Styling

- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Use CSS variables for theming
- Keep styles close to components
- Use shadcn/ui components when possible

### State Management

- Use React hooks for local state
- Use service layer for business logic
- Implement proper loading and error states
- Use optimistic updates when appropriate
- Cache data appropriately

### Testing

- Write unit tests for components
- Write integration tests for user flows
- Use React Testing Library
- Test user interactions, not implementation
- Mock external dependencies

### Accessibility

- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast

### Performance

- Use React.lazy for code splitting
- Implement proper loading states
- Optimize images and assets
- Use React.memo judiciously
- Monitor bundle size

## File Organization

### Component Files

```
components/
├── ui/                 # Base UI components
│   ├── button.tsx
│   ├── input.tsx
│   └── index.ts
├── forms/              # Form components
│   ├── LoginForm.tsx
│   ├── LoginForm.test.tsx
│   └── index.ts
└── features/           # Feature-specific components
    ├── auth/
    ├── resume/
    └── dashboard/
```

### Naming Conventions

- **Components**: PascalCase (`LoginForm.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Types**: PascalCase (`UserProfile.ts`)

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```
feat(auth): add password reset form
fix(resume): resolve file upload progress indicator
docs(components): update Button component documentation
test(auth): add unit tests for login form
```

## Issue Reporting

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/your-org/wisecv-web/issues).

### Bug Reports

Great bug reports tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Include browser and device information
- What you expected would happen
- What actually happens
- Screenshots or videos if applicable
- Notes (possibly including why you think this might be happening)

### Feature Requests

We welcome feature requests! Please:

- Explain the problem you're trying to solve
- Describe the solution you'd like
- Consider alternative solutions
- Provide mockups or wireframes if applicable
- Provide additional context

## Code Review Process

1. **Automated checks** must pass (tests, linting, type checking, build)
2. **At least one maintainer** must review and approve
3. **All conversations** must be resolved
4. **Branch must be up to date** with main
5. **Squash and merge** is preferred

## Design System

- Follow the established design tokens
- Use shadcn/ui components as the foundation
- Maintain consistency across the application
- Document new patterns in Storybook
- Consider accessibility in all designs

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Release Process

1. Version bumps follow [Semantic Versioning](https://semver.org/)
2. Releases are created from the `main` branch
3. Release notes are generated automatically
4. Docker images are built and published
5. Deployment to staging and production

## Community

- Be respectful and inclusive
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- Help others learn and grow
- Share knowledge and best practices

## Questions?

Feel free to reach out:

- 📧 Email: dev@wisecv.com
- 💬 Discussions: [GitHub Discussions](https://github.com/your-org/wisecv-web/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/wisecv-web/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.