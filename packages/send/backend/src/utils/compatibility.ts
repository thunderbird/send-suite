export const checkCompatibility = (versionA: string, versionB: string) => {
  const [majorA, minorA] = versionA.split('.').map(Number);
  const [majorB, minorB] = versionB.split('.').map(Number);

  if (majorA !== majorB) {
    return 'FORCE_UPDATE';
  }

  if (majorA === majorB && minorA !== minorB) {
    return 'PROMPT_UPDATE';
  }
  return 'COMPATIBLE';
};
