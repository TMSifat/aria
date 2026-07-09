import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}

/**
 * Normalises every controller return value into `{ data, message, timestamp }`.
 * Handlers may return `{ data, message }` to set a custom message; anything else
 * is treated as the `data` payload with a default "OK" message.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        const wrapped =
          payload &&
          typeof payload === 'object' &&
          'data' in payload &&
          'message' in payload;

        return {
          data: wrapped ? (payload as any).data : (payload ?? null),
          message: wrapped ? (payload as any).message : 'OK',
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
