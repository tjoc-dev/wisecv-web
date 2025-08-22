import { ServiceConfig } from './base-service';

/**
 * Service factory function type
 */
export type ServiceFactory<T> = (container: ServiceContainer) => T;

/**
 * Service registration options
 */
export interface ServiceRegistration<T> {
  factory: ServiceFactory<T>;
  singleton?: boolean;
  dependencies?: string[];
}

/**
 * Dependency injection container for managing services
 */
export class ServiceContainer {
  private services = new Map<string, ServiceRegistration<any>>();
  private instances = new Map<string, any>();
  private resolving = new Set<string>();

  /**
   * Register a service with the container
   */
  register<T>(
    name: string,
    factory: ServiceFactory<T>,
    options: Omit<ServiceRegistration<T>, 'factory'> = {}
  ): void {
    this.services.set(name, {
      factory,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies ?? [],
    });
  }

  /**
   * Register a singleton service
   */
  singleton<T>(
    name: string,
    factory: ServiceFactory<T>,
    dependencies: string[] = []
  ): void {
    this.register(name, factory, { singleton: true, dependencies });
  }

  /**
   * Register a transient service (new instance each time)
   */
  transient<T>(
    name: string,
    factory: ServiceFactory<T>,
    dependencies: string[] = []
  ): void {
    this.register(name, factory, { singleton: false, dependencies });
  }

  /**
   * Register a service instance directly
   */
  instance<T>(name: string, instance: T): void {
    this.instances.set(name, instance);
    this.services.set(name, {
      factory: () => instance,
      singleton: true,
      dependencies: [],
    });
  }

  /**
   * Resolve a service by name
   */
  resolve<T>(name: string): T {
    // Check for circular dependencies
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected: ${Array.from(this.resolving).join(' -> ')} -> ${name}`);
    }

    // Return existing singleton instance
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    const registration = this.services.get(name);
    if (!registration) {
      throw new Error(`Service '${name}' is not registered`);
    }

    this.resolving.add(name);

    try {
      // Resolve dependencies first
      const dependencies = registration.dependencies.map(dep => this.resolve(dep));
      
      // Create service instance
      const instance = registration.factory(this);

      // Cache singleton instances
      if (registration.singleton) {
        this.instances.set(name, instance);
      }

      return instance;
    } finally {
      this.resolving.delete(name);
    }
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services and instances
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
    this.resolving.clear();
  }

  /**
   * Create a child container that inherits from this one
   */
  createChild(): ServiceContainer {
    const child = new ServiceContainer();
    
    // Copy all registrations to child
    for (const [name, registration] of this.services) {
      child.services.set(name, registration);
    }
    
    // Copy singleton instances to child
    for (const [name, instance] of this.instances) {
      child.instances.set(name, instance);
    }
    
    return child;
  }
}

/**
 * Global service container instance
 */
export const serviceContainer = new ServiceContainer();

/**
 * Service locator pattern for easy access
 */
export class ServiceLocator {
  private static container = serviceContainer;

  static setContainer(container: ServiceContainer): void {
    ServiceLocator.container = container;
  }

  static get<T>(name: string): T {
    return ServiceLocator.container.resolve<T>(name);
  }

  static has(name: string): boolean {
    return ServiceLocator.container.has(name);
  }
}

/**
 * Decorator for automatic service injection
 */
export function inject(serviceName: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return ServiceLocator.get(serviceName);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Service configuration registry
 */
export class ServiceConfigRegistry {
  private static configs = new Map<string, ServiceConfig>();

  static register(serviceName: string, config: ServiceConfig): void {
    ServiceConfigRegistry.configs.set(serviceName, config);
  }

  static get(serviceName: string): ServiceConfig {
    return ServiceConfigRegistry.configs.get(serviceName) || {};
  }

  static getAll(): Map<string, ServiceConfig> {
    return new Map(ServiceConfigRegistry.configs);
  }
}

/**
 * Helper function to create service factories
 */
export function createServiceFactory<T>(
  ServiceClass: new (config?: ServiceConfig, ...deps: any[]) => T,
  configKey?: string
): ServiceFactory<T> {
  return (container: ServiceContainer) => {
    const config = configKey ? ServiceConfigRegistry.get(configKey) : {};
    return new ServiceClass(config);
  };
}

/**
 * Helper function to create service factories with dependencies
 */
export function createServiceFactoryWithDeps<T>(
  ServiceClass: new (config: ServiceConfig, ...deps: any[]) => T,
  dependencies: string[],
  configKey?: string
): ServiceFactory<T> {
  return (container: ServiceContainer) => {
    const config = configKey ? ServiceConfigRegistry.get(configKey) : {};
    const deps = dependencies.map(dep => container.resolve(dep));
    return new ServiceClass(config, ...deps);
  };
}