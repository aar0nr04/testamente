import { describe, expect, it } from 'vitest';
import { canAccessRoute, type RouteAccessState } from './RouteGuards';

const base: RouteAccessState = { signedIn: true, emailVerified: true, appCheckReady: true, claims: { owner: false, admin: false, professional_reviewer: false } };

describe('canAccessRoute', () => {
  it('requires a verified email, App Check, and a permitted Custom Claim', () => {
    expect(canAccessRoute(base, ['admin'], true, true)).toBe(false);
    expect(canAccessRoute({ ...base, claims: { ...base.claims, admin: true } }, ['admin'], true, true)).toBe(true);
    expect(canAccessRoute({ ...base, emailVerified: false, claims: { ...base.claims, admin: true } }, ['admin'], true, true)).toBe(false);
    expect(canAccessRoute({ ...base, appCheckReady: false, claims: { ...base.claims, admin: true } }, ['admin'], true, true)).toBe(false);
  });

  it('allows a reviewer claim for review but not for administration', () => {
    const reviewer = { ...base, claims: { ...base.claims, professional_reviewer: true } };
    expect(canAccessRoute(reviewer, ['professional_reviewer', 'admin', 'owner'], true, true)).toBe(true);
    expect(canAccessRoute(reviewer, ['admin', 'owner'], true, true)).toBe(false);
  });
});
