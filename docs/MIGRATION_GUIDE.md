# Migration Guide: Enhanced Architecture Patterns

This guide helps you migrate existing components to use the new enhanced architecture patterns including standardized loading states, error handling, service layer, and type safety improvements.

## Overview of Changes

The enhanced architecture introduces:

1. **Standardized Service Layer** - Centralized API interactions with consistent error handling
2. **Enhanced Loading States** - Unified loading state management across components
3. **Comprehensive Error Handling** - Structured error boundaries and error state components
4. **Improved Type Safety** - Comprehensive enum types and interfaces
5. **Service Hooks** - React hooks for seamless service integration

## Migration Steps

### 1. Update Imports

**Before:**
```typescript
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
```

**After:**
```typescript
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { useService } from '@/hooks/use-service';
import { useLoading } from '@/hooks/use-loading';
import { SERVICE_NAMES } from '@/lib/services/service-registry';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ErrorState } from '@/components/error/ErrorStates';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading';
import { UploadStatus, FileType } from '@/types/common';
```

### 2. Replace Manual API Calls with Service Hooks

**Before:**
```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleUpload = async (file: File) => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const result = await response.json();
    // Handle success
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

**After:**
```typescript
const {
  execute: uploadFile,
  loading: isUploading,
  error: uploadError,
  retry: retryUpload
} = useService(SERVICE_NAMES.UPLOAD, 'uploadFile');

const handleUpload = useCallback(async (file: File) => {
  const result = await uploadFile(file);
  
  if (result.success) {
    // Handle success
    toast.success('Upload successful');
  }
  // Error handling is automatic via service layer
}, [uploadFile]);
```

### 3. Implement Enhanced Loading States

**Before:**
```typescript
{isLoading && <div>Loading...</div>}
```

**After:**
```typescript
{isUploading && <LoadingSpinner text="Uploading file..." />}

{/* Or for overlay loading */}
<LoadingOverlay isLoading={isUploading} text="Processing...">
  <YourComponent />
</LoadingOverlay>
```

### 4. Add Comprehensive Error Handling

**Before:**
```typescript
{error && (
  <div className="text-red-500">
    {error}
    <button onClick={retry}>Retry</button>
  </div>
)}
```

**After:**
```typescript
{uploadError && (
  <ErrorState
    error={uploadError}
    onRetry={retryUpload}
  />
)}
```

### 5. Wrap Components with Error Boundaries

**Before:**
```typescript
export default function MyComponent() {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

**After:**
```typescript
export default function MyComponent() {
  return (
    <ErrorBoundary level="component">
      <div>
        {/* Component content */}
      </div>
    </ErrorBoundary>
  );
}
```

### 6. Use Enhanced Type Safety

**Before:**
```typescript
interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
}
```

**After:**
```typescript
import { UploadStatus } from '@/types/common';

interface UploadState {
  status: UploadStatus;
}
```

## Component Migration Example

Here's a complete before/after example:

### Before (Legacy Pattern)

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      // Handle success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files?.[0] || null)} 
      />
      
      {error && (
        <div className="text-red-500">{error}</div>
      )}
      
      <Button 
        onClick={handleUpload} 
        disabled={!file || isLoading}
      >
        {isLoading ? 'Uploading...' : 'Upload'}
      </Button>
    </div>
  );
}
```

### After (Enhanced Pattern)

```typescript
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useService } from '@/hooks/use-service';
import { SERVICE_NAMES } from '@/lib/services/service-registry';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ErrorState } from '@/components/error/ErrorStates';
import { LoadingSpinner } from '@/components/ui/loading';
import { UploadStatus } from '@/types/common';

export default function EnhancedFileUploader() {
  const [file, setFile] = useState<File | null>(null);
  
  const {
    execute: uploadFile,
    loading: isUploading,
    error: uploadError,
    retry: retryUpload
  } = useService(SERVICE_NAMES.UPLOAD, 'uploadFile');

  const handleUpload = useCallback(async () => {
    if (!file) return;
    
    const result = await uploadFile(file);
    
    if (result.success) {
      toast.success('File uploaded successfully');
      setFile(null); // Reset form
    }
  }, [file, uploadFile]);

  return (
    <ErrorBoundary level="component">
      <div className="space-y-4">
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={isUploading}
        />
        
        {uploadError && (
          <ErrorState
            error={uploadError}
            onRetry={retryUpload}
          />
        )}
        
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Uploading...
            </div>
          ) : (
            'Upload File'
          )}
        </Button>
      </div>
    </ErrorBoundary>
  );
}
```

## Service Integration

### Creating Custom Services

If you need to create a new service:

```typescript
// src/lib/services/my-custom-service.ts
import { BaseService } from './base-service';
import { ApiService } from './api-service';

export class MyCustomService extends BaseService {
  constructor(private apiService: ApiService) {
    super('MyCustomService');
  }

  async customOperation(data: any) {
    return this.execute(async () => {
      const response = await this.apiService.post('/api/custom', data);
      return response.data;
    });
  }
}
```

Then register it in the service registry:

```typescript
// In service-registry.ts
export const SERVICE_NAMES = {
  // ... existing services
  MY_CUSTOM: 'MyCustomService'
} as const;

// In registerServices function
container.registerSingleton(
  SERVICE_NAMES.MY_CUSTOM,
  () => new MyCustomService(container.resolve(SERVICE_NAMES.API))
);
```

## Best Practices

1. **Always wrap components with ErrorBoundary** at appropriate levels
2. **Use service hooks** instead of direct API calls
3. **Leverage enum types** for better type safety
4. **Implement consistent loading states** across all components
5. **Handle errors gracefully** with retry mechanisms
6. **Use useCallback** for event handlers to prevent unnecessary re-renders
7. **Provide meaningful error messages** and recovery options

## Testing Considerations

When testing components using the new architecture:

```typescript
// Mock service hooks in tests
jest.mock('@/hooks/use-service', () => ({
  useService: jest.fn(() => ({
    execute: jest.fn(),
    loading: false,
    error: null,
    retry: jest.fn()
  }))
}));
```

## Performance Benefits

- **Reduced bundle size** through shared service instances
- **Better caching** with centralized API layer
- **Optimized re-renders** with proper hook usage
- **Consistent error handling** reduces duplicate code
- **Type safety** catches errors at compile time

## Troubleshooting

### Common Issues

1. **Service not found**: Ensure service is registered in `service-registry.ts`
2. **Type errors**: Check that you're importing types from `@/types/common`
3. **Hook errors**: Verify hooks are used inside React components
4. **Loading states**: Ensure LoadingOverlay has proper children prop

### Migration Checklist

- [ ] Update imports to use new architecture components
- [ ] Replace manual API calls with service hooks
- [ ] Add error boundaries to component hierarchy
- [ ] Implement standardized loading states
- [ ] Use enum types instead of string literals
- [ ] Add proper error handling with retry mechanisms
- [ ] Test components with new patterns
- [ ] Update documentation and examples

This migration guide should help you successfully adopt the enhanced architecture patterns while maintaining code quality and user experience.