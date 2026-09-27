/**
 * Shape of the object attached to `request.user` by `JwtStrategy.validate`.
 * Mirrors the Prisma `User` fields selected there; keep the two in sync.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  organizationId: string;
  guardProfile: { id: string; assignedSiteId: string | null } | null;
  clientProfile: { id: string } | null;
}
