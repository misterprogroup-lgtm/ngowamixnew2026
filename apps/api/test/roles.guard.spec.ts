import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

describe('RolesGuard', () => {
  function createGuardWithRoles(roles: UserRole[] | undefined): RolesGuard {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(roles),
    } as any;
    return new RolesGuard(reflector);
  }

  it('should allow access when no roles are required', () => {
    const guard = createGuardWithRoles(undefined);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.FAN } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    const guard = createGuardWithRoles([UserRole.ADMIN]);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.ADMIN } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user has wrong role', () => {
    const guard = createGuardWithRoles([UserRole.ADMIN]);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.FAN } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
    let threw = false;
    try {
      guard.canActivate(ctx);
    } catch (e) {
      threw = true;
      expect(e).toBeInstanceOf(ForbiddenException);
    }
    expect(threw).toBe(true);
  });

  it('should deny access when user is undefined', () => {
    const guard = createGuardWithRoles([UserRole.ADMIN]);
    const req = { user: undefined };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
    let threw = false;
    try {
      guard.canActivate(ctx);
    } catch (e) {
      threw = true;
      expect(e).toBeInstanceOf(ForbiddenException);
    }
    expect(threw).toBe(true);
  });
});
