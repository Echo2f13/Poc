import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        // Already wrapped — pass through
        if (value && typeof value === 'object' && ('data' in value || 'error' in value)) {
          return value;
        }
        return { data: value };
      }),
    );
  }
}
