import { describe, expect, it } from 'vitest';
import { emptyPermissionClaims, permissionClaimsFromToken } from './AuthContext';

describe('permissionClaimsFromToken', () => {
  it('only recognizes explicit true Custom Claims', () => {
    expect(permissionClaimsFromToken({ claims: { owner: true, admin: 'true', professional_reviewer: false } })).toEqual({ isOwner: true, isAdmin: false, isProfessionalReviewer: false });
  });

  it('does not derive administration from a profile-shaped token', () => {
    expect(permissionClaimsFromToken({ claims: { role: 'admin' } })).toEqual(emptyPermissionClaims);
  });

  it('does not expose expired time-bound staff claims', () => {
    expect(permissionClaimsFromToken({ claims: { admin: true, professional_reviewer: true, staff_expires_at: Date.now() - 1 } })).toEqual(emptyPermissionClaims);
  });
});
