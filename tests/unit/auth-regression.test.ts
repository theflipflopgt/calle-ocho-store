import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('auth regressions', () => {
  it('does not race browser and server sign-out operations', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'contexts/auth-context.tsx'), 'utf8');

    expect(source).not.toMatch(/Promise\.allSettled\(\s*\[/);
    expect(source.indexOf("fetch('/api/auth/signout'")).toBeLessThan(
      source.indexOf("supabase.auth.signOut({ scope: 'local' })")
    );
  });

  it('keeps the secure profile fallback in the admin proxy', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'proxy.ts'), 'utf8');

    expect(source).toContain("rpc('current_authenticated_profile')");
  });
});
