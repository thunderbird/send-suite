export function shouldRunSuite(
  config: Record<string, string>,
  suiteName: string
) {
  if (process.env.IS_CI_AUTOMATION) return true;
  const canRun = Object.values(config).every((value) => !!value);
  if (!canRun) {
    console.warn(`env variables are not correctly set to run ${suiteName}`);
  }
  return canRun;
}
