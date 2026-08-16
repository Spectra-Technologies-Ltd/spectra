import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

/**
 * Global interceptor: records every mutating request (POST/PATCH/PUT/DELETE)
 * into the AuditLog table with actor, entity, IP and user agent.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req?.method;
    if (!method || !['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const route = req?.route?.path ?? req?.url ?? 'unknown';
    const entityId =
      req?.params?.id ??
      req?.params?.guardId ??
      req?.params?.siteId ??
      req?.params?.clientId ??
      req?.params?.incidentId ??
      '';

    return next.handle().pipe(
      tap((response) => {
        const createdId =
          response?.id ??
          response?.data?.id ??
          (Array.isArray(response) ? response[0]?.id : undefined);
        this.auditService.log({
          userId: req?.user?.id,
          action: method,
          entity: route,
          entityId: createdId ?? entityId ?? '',
          newValues: { body: req?.body },
          ipAddress: req?.ip,
          userAgent: req?.get?.('user-agent'),
        });
      }),
    );
  }
}
