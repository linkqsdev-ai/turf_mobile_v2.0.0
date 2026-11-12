/**
 * password-rules.ts
 *
 * The password rule the server enforces (routes/auth.ts `passwordSchema`),
 * mirrored so the Change Password screen can tick rules off as you type
 * instead of learning them one rejected submit at a time.
 */

export const PASSWORD_RULES: { key: string; label: string; test: (p: string) => boolean }[] = [
  { key: 'length', label: '8–12 characters', test: (p) => p.length >= 8 && p.length <= 12 },
  { key: 'upper', label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'A number', test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'A special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function passwordRuleResults(password: string): { key: string; label: string; met: boolean }[] {
  return PASSWORD_RULES.map((r) => ({ key: r.key, label: r.label, met: r.test(password || '') }));
}

/** The first reason the form can't be submitted yet, or null. */
export function changePasswordIssue(values: { current: string; next: string; confirm: string }): string | null {
  if (!values.current) return 'Enter your current password';
  if (!values.next) return 'Enter a new password';
  const unmet = passwordRuleResults(values.next).find((r) => !r.met);
  if (unmet) return `New password needs ${unmet.label.charAt(0).toLowerCase()}${unmet.label.slice(1)}`;
  if (values.next === values.current) return 'New password must be different from your current one';
  if (values.confirm !== values.next) return "Passwords don't match";
  return null;
}

/**
 * A session started on the device without the server (demo accounts, or when
 * the backend was unreachable) carries a `local_token_` and has no server
 * account whose password could be changed.
 */
export function isLocalSession(token?: string | null): boolean {
  return !token || token.startsWith('local_token_');
}
