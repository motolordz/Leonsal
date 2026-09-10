// Shared by the production gate and adversarial regression fixtures.
export function pixelDistance(a, b) {
  if (a.length !== b.length) return Infinity;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  return total / Math.max(1, a.length);
}
export function statesAreDistinct(signatures, threshold = 1.2) {
  if (signatures.length !== 5) return false;
  for (let i = 1; i < signatures.length; i++) {
    if (pixelDistance(signatures[i-1], signatures[i]) <= threshold) return false;
  }
  // Identical non-adjacent states are also invalid, regardless of PNG metadata.
  for (let i = 0; i < signatures.length; i++) for (let j = i+1; j < signatures.length; j++) {
    if (pixelDistance(signatures[i], signatures[j]) === 0) return false;
  }
  return true;
}
