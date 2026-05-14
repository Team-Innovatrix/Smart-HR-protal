/**
 * Production Guard Utility
 * ========================
 * Import this at the TOP of any seed or maintenance script.
 * It will immediately terminate the process if NODE_ENV is "production",
 * preventing accidental data corruption in live databases.
 *
 * Usage:
 *   import { assertNotProduction } from '@/lib/utils/productionGuard';
 *   assertNotProduction('seedDatabase');
 */

export function assertNotProduction(scriptName: string = 'script'): void {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      `\n🚫 BLOCKED: "${scriptName}" cannot run in production.\n` +
      `   NODE_ENV is currently set to "production".\n` +
      `   This script is only safe to run in development or staging.\n` +
      `   If you truly need to run this against a production database,\n` +
      `   temporarily set NODE_ENV=development in a safe, isolated environment.\n`
    );
    process.exit(1);
  }

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    console.error(
      `\n⚠️  WARNING: NODE_ENV is not set or is ambiguous.\n` +
      `   Refusing to run "${scriptName}" to protect production data.\n`
    );
    process.exit(1);
  }

  console.log(
    `✅ Production guard passed for "${scriptName}" (NODE_ENV=${process.env.NODE_ENV})`
  );
}

/**
 * Async variant — use when you need to prompt before running.
 * Shows a confirmation prompt in non-destructive scripts.
 */
export async function assertNotProductionWithConfirmation(
  scriptName: string,
  message: string = 'Are you sure you want to run this? Type "yes" to continue: '
): Promise<void> {
  assertNotProduction(scriptName);

  // Interactive confirmation for sensitive scripts (e.g., cleanup:fake-users)
  const { createInterface } = await import('readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  await new Promise<void>((resolve, reject) => {
    rl.question(`\n⚠️  ${message}`, (answer) => {
      rl.close();
      if (answer.trim().toLowerCase() !== 'yes') {
        console.log('❌ Aborted.');
        process.exit(0);
      }
      resolve();
    });
  });
}
