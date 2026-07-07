import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private normalizeRole(role: string): 'ADMIN' | 'EMPLOYEE' | string {
    if (['ADMIN', 'CEO', 'OPERATIONS_MANAGER', 'HR', 'SUPERVISOR'].includes(role)) {
      return 'ADMIN';
    }
    if (['EMPLOYEE', 'GUARD'].includes(role)) {
      return 'EMPLOYEE';
    }
    return role;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('User session does not have access permissions');
    }
    const normalizedUserRole = this.normalizeRole(user.role);
    const normalizedRequiredRoles = requiredRoles.map((role) => this.normalizeRole(role));
    const hasRole = normalizedRequiredRoles.includes(normalizedUserRole);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }
    return true;
  }
}
