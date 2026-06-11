import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  slowRequests: number;
  errorCount: number;
}

class ServerPerformanceMonitor {
  private static instance: ServerPerformanceMonitor;
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    slowRequests: 0,
    errorCount: 0
  };

  static getInstance(): ServerPerformanceMonitor {
    if (!ServerPerformanceMonitor.instance) {
      ServerPerformanceMonitor.instance = new ServerPerformanceMonitor();
    }
    return ServerPerformanceMonitor.instance;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  updateMetrics(responseTime: number, isError: boolean = false): void {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;
    
    if (responseTime > 1000) { // Slow requests > 1 second
      this.metrics.slowRequests++;
    }
    
    if (isError) {
      this.metrics.errorCount++;
    }
  }

  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorCount: 0
    };
  }
}

// Performance monitoring middleware
export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const monitor = ServerPerformanceMonitor.getInstance();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (this: Response, chunk?: any, encoding?: any, cb?: () => void) {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;

    monitor.updateMetrics(responseTime, isError);

    // Log slow requests
    if (responseTime > 1000) {
    }

    // Skip headers to avoid conflicts with static file serving

    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
}

// Memory optimization middleware (simplified to avoid header conflicts)
export function memoryOptimizationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Simplified to avoid header conflicts with static file serving
  next();
}

// Request size limiting middleware
export function requestSizeLimitMiddleware(maxSize: number = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request too large',
        maxSize: `${maxSize / 1024 / 1024}MB`,
        receivedSize: `${contentLength / 1024 / 1024}MB`
      });
    }
    
    next();
  };
}

// Request augmented with connection metadata
interface ConnectionInfoRequest extends Request {
  connectionInfo?: {
    timestamp: number;
    userAgent?: string;
    ip?: string;
  };
}

// Database connection pooling middleware
export function connectionPoolMiddleware(req: ConnectionInfoRequest, res: Response, next: NextFunction) {
  // Add connection info to request
  req.connectionInfo = {
    timestamp: Date.now(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  };
  
  next();
}

// Error handling optimization
export function optimizedErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  const monitor = ServerPerformanceMonitor.getInstance();
  monitor.updateMetrics(0, true); // Log error
  
  console.error(`Error in ${req.method} ${req.path}:`, error.message);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    requestId: res.getHeader('X-Request-ID')
  });
}

export { ServerPerformanceMonitor };