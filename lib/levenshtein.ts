export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Keep `a` as the shorter string — the DP rows are sized by a.length.
  if (a.length > b.length) [a, b] = [b, a];

  let prev = new Array<number>(a.length + 1);
  let curr = new Array<number>(a.length + 1);
  for (let j = 0; j <= a.length; j++) prev[j] = j;

  for (let i = 1; i <= b.length; i++) {
    curr[0] = i;
    const bChar = b.charCodeAt(i - 1);
    for (let j = 1; j <= a.length; j++) {
      if (bChar === a.charCodeAt(j - 1)) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = Math.min(prev[j - 1] + 1, curr[j - 1] + 1, prev[j] + 1);
      }
    }
    [prev, curr] = [curr, prev];
  }

  return prev[a.length];
}
