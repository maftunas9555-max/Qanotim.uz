import type { NextFunction, Request, Response } from 'express';

/**
 * Express 4 does not await async route handlers, so a rejected promise
 * anywhere in one — including a synchronous throw before the first `await`,
 * e.g. a JSON.parse on unexpectedly malformed stored data — becomes an
 * unhandled rejection. Node's current default terminates the process on
 * those, which would take the whole server down over a single bad request.
 * Wrapping every async handler in this forwards the error to Express's
 * normal error-handling middleware instead.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
