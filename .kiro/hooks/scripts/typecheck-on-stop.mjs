// Stop hook: type-check when there are uncommitted TypeScript changes.
// Exit 1 with a { decision, reason } body starts another agent turn using the reason.
import { execSync } from 'node:child_process';

const changed = execSync('git status --porcelain -- "*.ts" "*.tsx"', { encoding: 'utf8' }).trim();
if (!changed) process.exit(0);

try {
  execSync('npm run typecheck --silent', { encoding: 'utf8', stdio: 'pipe' });
} catch (err) {
  const output = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim().slice(-4000);
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason: `npm run typecheck failed. Fix these errors before finishing:\n${output}`,
    }),
  );
  process.exit(1);
}
