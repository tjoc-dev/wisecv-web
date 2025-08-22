# WiseCV Web Application Architecture

This document outlines the enhanced architecture and best practices implemented in the WiseCV web application.

## Overview

The WiseCV web application has been enhanced with standardized patterns for:
- Loading state management
- Error handling and boundaries
- Service layer architecture with dependency injection
- Type safety improvements
- Consistent UI components

## Architecture Components

### 1. Loading State Management

#### Hooks
- **`useLoading`**: Standardized loading state hook for single operations
- **`useMultipleLoading`**: Hook for managing multiple concurrent loading states
- **`useService`**: Enhanced service hook with integrated loading states

#### Components
- **Loading Components** (`src/components/ui/loading.tsx`):
  - `LoadingSpinner`: Animated spinner for general loading
  - `LoadingDots`: Pulsing dots animation
  - `LoadingPulse`: Pulse animation for content placeholders
  - `LoadingOverlay`: Full-screen loading overlay

#### Skeleton Loaders
- `CardSkeleton`: For card-based content
- `TableSkeleton`: For tabular data
- `ListSkeleton`: For list items
- `FormSkeleton`: For form layouts
- `JobCardSkeleton`: Specific to job cards
- `ProfileSkeleton`: For profile sections
- `PageSkeleton`: Full page loading state

### 2. Error Handling

#### Error Boundaries
- **`ErrorBoundary`**: Class component for catching React errors
- **`AsyncErrorBoundary`**: For handling promise rejections
- **`withErrorBoundary`**: HOC for wrapping components

#### Error State Components
- **`ErrorStates.tsx`**: Collection of error UI components
  - `NetworkError`: For network-related errors
  - `ServerError`: For 5xx server errors
  - `NotFoundError`: For 404 errors
  - `NoResultsError`: For empty states
  - `GenericError`: Fallback error component
  - `InlineError`: For inline error messages
  - `ErrorToastContent`: For toast notifications

#### Error Handling Hook
- **`useErrorHandler`**: Hook for functional components to handle errors

### 3. Service Layer Architecture

#### Base Service
- **`BaseService`**: Abstract base class with common functionality
  - Standardized error handling
  - Retry logic with exponential backoff
  - Request/response logging
  - Health status monitoring
  - Timeout management

#### API Service
- **`ApiService`**: HTTP-specific service extending BaseService
  - RESTful API methods (GET, POST, PUT, PATCH, DELETE)
  - Request/response interceptors
  - File upload with progress tracking
  - File download functionality
  - Automatic token management

#### Dependency Injection
- **`ServiceContainer`**: IoC container for service management
  - Singleton and transient service registration
  - Dependency resolution
  - Circular dependency detection
  - Service factory patterns

#### Service Registry
- **`ServiceRegistry`**: Central service configuration
  - Pre-configured business services (Auth, Resume, Job, Payment, Tier, Upload)
  - Environment-based configuration
  - Health monitoring
  - Service initialization

### 4. Type Safety Enhancements

#### Common Types
- **`LoadingState`**: Enum for loading states (IDLE, LOADING, SUCCESS, ERROR)
- **`ErrorCode`**: Comprehensive error code enumeration
- **Business Enums**: TierType, PaymentStatus, JobStatus, ResumeStatus, etc.
- **UI Enums**: ComponentSize, ComponentVariant

#### Service Types
- **`ServiceResult<T>`**: Standardized service operation result
- **`ServiceError`**: Enhanced error class with error codes
- **`ServiceConfig`**: Base service configuration interface

## Usage Patterns

### 1. Using Loading States

```tsx
import { useLoading } from '@/hooks/use-loading';
import { LoadingSpinner } from '@/components/ui/loading';

function MyComponent() {
  const { isLoading, execute } = useLoading();

  const handleSubmit = () => {
    execute(async () => {
      await someAsyncOperation();
    }, {
      onSuccess: () => console.log('Success!'),
      onError: (error) => console.error(error)
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <button onClick={handleSubmit}>
      Submit
    </button>
  );
}
```

### 2. Using Service Layer

```tsx
import { useService } from '@/hooks/use-service';
import { SERVICE_NAMES } from '@/lib/services/service-registry';

function ResumeList() {
  const {
    data: resumes,
    loading,
    error,
    execute: loadResumes,
    retry
  } = useService(SERVICE_NAMES.RESUME, 'getResumes', {
    immediate: true,
    onError: (error) => {
      toast.error(`Failed to load resumes: ${error.message}`);
    }
  });

  if (loading) {
    return <ListSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={retry} />;
  }

  return (
    <div>
      {resumes?.map(resume => (
        <ResumeCard key={resume.id} resume={resume} />
      ))}
    </div>
  );
}
```

### 3. Error Boundaries

```tsx
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary level="page">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={
            <ErrorBoundary level="section">
              <Dashboard />
            </ErrorBoundary>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### 4. Service Registration

```tsx
// In your app initialization
import { initializeServices } from '@/lib/services/service-registry';

function main() {
  // Initialize services
  initializeServices();
  
  // Start health monitoring in development
  if (import.meta.env.DEV) {
    const monitor = ServiceHealthMonitor.getInstance();
    monitor.startMonitoring(60000); // Check every minute
  }
  
  // Render app
  ReactDOM.render(<App />, document.getElementById('root'));
}
```

## Best Practices

### 1. Loading States
- Always provide loading feedback for operations > 200ms
- Use skeleton loaders for content that will be replaced
- Use spinners for actions and operations
- Implement progressive loading for large datasets

### 2. Error Handling
- Wrap components with appropriate error boundaries
- Provide meaningful error messages to users
- Implement retry mechanisms for transient errors
- Log errors for debugging and monitoring

### 3. Service Layer
- Use dependency injection for service management
- Implement proper error handling in all service methods
- Add timeout and retry logic for network operations
- Monitor service health in production

### 4. Type Safety
- Use enums instead of string literals
- Define proper interfaces for all data structures
- Leverage TypeScript's strict mode
- Use generic types for reusable components

## File Structure

```
src/
├── components/
│   ├── error/
│   │   ├── ErrorBoundary.tsx
│   │   └── ErrorStates.tsx
│   └── ui/
│       ├── loading.tsx
│       └── skeleton.tsx
├── hooks/
│   ├── use-loading.ts
│   ├── use-service.ts
│   └── use-auth.tsx
├── lib/
│   └── services/
│       ├── base-service.ts
│       ├── api-service.ts
│       ├── service-container.ts
│       └── service-registry.ts
└── types/
    ├── common.ts
    └── user.ts
```

## Migration Guide

### From Old Loading Patterns

**Before:**
```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await api.post('/data');
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**After:**
```tsx
const { execute, isLoading, error } = useLoading();

const handleSubmit = () => {
  execute(async () => {
    await api.post('/data');
  });
};
```

### From Direct API Calls

**Before:**
```tsx
const [resumes, setResumes] = useState([]);

useEffect(() => {
  fetch('/api/resumes')
    .then(res => res.json())
    .then(setResumes);
}, []);
```

**After:**
```tsx
const { data: resumes } = useService(
  SERVICE_NAMES.RESUME,
  'getResumes',
  { immediate: true }
);
```

## Performance Considerations

1. **Service Instances**: Services are singletons by default to reduce memory usage
2. **Request Deduplication**: Implement request deduplication for identical concurrent requests
3. **Caching**: Add response caching for frequently accessed data
4. **Lazy Loading**: Use React.lazy() with error boundaries for code splitting
5. **Skeleton Loading**: Prefer skeleton loaders over spinners for better perceived performance

## Testing Strategy

1. **Unit Tests**: Test individual services and hooks
2. **Integration Tests**: Test service interactions
3. **Error Boundary Tests**: Verify error handling scenarios
4. **Loading State Tests**: Test loading state transitions
5. **Service Health Tests**: Monitor service availability

## Monitoring and Observability

1. **Service Health**: Built-in health monitoring for all services
2. **Error Tracking**: Structured error logging with context
3. **Performance Metrics**: Track loading times and success rates
4. **User Experience**: Monitor loading state durations

This architecture provides a solid foundation for scalable, maintainable, and user-friendly React applications with consistent patterns across all components.