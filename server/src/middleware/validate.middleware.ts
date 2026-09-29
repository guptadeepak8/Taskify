import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function formatZodError(error: ZodError) {
  const issues = error.issues;
  const firstIssue = issues[0];
  const message = firstIssue ? firstIssue.message : 'Validation failed';
  const details = issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'root',
    message: issue.message,
  }));

  return {
    code: 'VALIDATION_ERROR',
    message,
    details,
  };
}

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: formatZodError(error),
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        configurable: true,
        enumerable: true,
        writable: true,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: formatZodError(error),
        });
      }
      next(error);
    }
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      Object.defineProperty(req, 'params', {
        value: parsed,
        configurable: true,
        enumerable: true,
        writable: true,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: formatZodError(error),
        });
      }
      next(error);
    }
  };
}
