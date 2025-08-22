# WiseCV Web Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)

A modern, type-safe React application for CV/resume management with enhanced architecture patterns. Built with React 18, TypeScript, and Vite for optimal performance and developer experience.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based authentication with refresh tokens
- 📄 **Resume Management** - Upload, edit, and manage CV/resume files with real-time preview
- 💼 **Job Application Tracking** - Track job applications, interviews, and status updates
- 💳 **Subscription Management** - Tier-based subscription system with payment integration
- 📊 **Analytics Dashboard** - User behavior insights and performance tracking
- 🔔 **Real-time Notifications** - Push notifications for important updates
- 🎨 **Modern UI/UX** - Beautiful, responsive design with dark/light mode support
- ⚡ **Performance Optimized** - Code splitting, lazy loading, and optimized bundles
- 🔒 **Type Safety** - Full TypeScript integration with strict type checking
- 🏗️ **Service Architecture** - Clean architecture with dependency injection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- pnpm 8+ ([Install](https://pnpm.io/installation))
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/wisecv-web.git
   cd wisecv-web
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   ```
   http://localhost:8080
   ```

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop the application
docker-compose down
```

### Manual Docker Build

```bash
# Build the Docker image
docker build -t wisecv-web .

# Run the container
docker run -p 80:80 wisecv-web
```

The application will be available at `http://localhost` (port 80).

## 🏗️ Architecture

This application implements modern React patterns with:

- **Service Layer Architecture**: Centralized business logic with dependency injection
- **Enhanced Loading States**: Consistent loading patterns across components
- **Comprehensive Error Handling**: Type-safe error boundaries and recovery
- **Type Safety**: Full TypeScript integration with strict type checking
- **Component Composition**: Reusable, composable UI components
- **Custom Hooks**: Encapsulated logic for state management and side effects

## 📚 Documentation

📚 **[Architecture Guide](./docs/ARCHITECTURE.md)** - Detailed architecture overview and patterns

🔄 **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Step-by-step migration to new patterns

⚡ **[Tier Improvements](./docs/TIER_IMPROVEMENTS.md)** - Performance and feature enhancements

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm dev:host     # Start dev server with network access

# Building
pnpm build        # Build for production
pnpm preview      # Preview production build locally

# Code Quality
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm type-check   # Run TypeScript type checking
pnpm format       # Format code with Prettier

# Testing
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
```

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS, Lucide Icons
- **State Management**: Custom service layer with dependency injection
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **Form Handling**: React Hook Form with Zod validation
- **Error Handling**: React Error Boundaries with recovery patterns
- **Build Tool**: Vite with optimized production builds
- **Testing**: Vitest, React Testing Library
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=10000

# Authentication
VITE_JWT_SECRET=your-jwt-secret

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true

# External Services
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_FIREBASE_CONFIG='{"apiKey":"..."}'
```
## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   ├── services/       # Service layer architecture
│   ├── api/           # API client and endpoints
│   ├── auth/          # Authentication utilities
│   └── utils/         # Helper functions
├── pages/              # Route components
├── types/              # TypeScript type definitions
├── styles/             # Global styles and Tailwind config
└── assets/             # Static assets
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Deployment Platforms

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Drag and drop the `dist` folder or connect via Git
- **Docker**: Use the provided Dockerfile for containerized deployments
- **Static Hosting**: Deploy the `dist` folder to any static hosting service

### Environment Configuration

For production deployments, ensure you set the following environment variables:

- `VITE_API_URL`: Your production API URL
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `VITE_FIREBASE_CONFIG`: Your Firebase configuration

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed
4. **Run quality checks**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- **Code Style**: Follow the ESLint and Prettier configurations
- **TypeScript**: Use strict typing, avoid `any` types
- **Components**: Create reusable, well-documented components
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update README and inline documentation

Please refer to the [Architecture Guide](./docs/ARCHITECTURE.md) for development patterns and the [Migration Guide](./docs/MIGRATION_GUIDE.md) for updating existing components.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - The web framework used
- [Vite](https://vitejs.dev/) - Build tool and development server
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful and accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety and developer experience

## 📞 Support

If you have any questions or need help:

- 📧 **Email**: support@wisecv.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/wisecv-web/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-org/wisecv-web/discussions)

---

**Made with ❤️ by the WiseCV Team**
