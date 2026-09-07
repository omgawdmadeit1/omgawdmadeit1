import { UserRole } from '@prisma/client';

export type AuthContext = {
  userId: string;
  role: UserRole;
  tenantId: string;
};

export function getAuthContext(): AuthContext {
  const userId = process.env.DEFAULT_USER_ID;
  const tenantId = process.env.DEFAULT_TENANT_ID ?? 'local-tenant';
  const role = (process.env.DEFAULT_USER_ROLE as UserRole | undefined) ?? UserRole.SELLER;
  if (!userId) throw new Error('DEFAULT_USER_ID is required for auth context');
  return { userId, role, tenantId };
}

export function requireRole(auth: AuthContext, roles: UserRole[]) {
  if (!roles.includes(auth.role)) {
    throw new Error(`Forbidden: requires role in [${roles.join(', ')}]`);
  }
}
