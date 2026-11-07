const SHA256_PATTERN = /^[a-f\d]{64}$/i;

export function sha256Matches(candidateHash: string, originalHash: string): boolean {
  if (!SHA256_PATTERN.test(candidateHash)) {
    throw new Error("The uploaded image did not produce a valid SHA-256 hash.");
  }
  if (!SHA256_PATTERN.test(originalHash)) {
    throw new Error("The stored original image has a missing or invalid SHA-256 hash.");
  }
  return candidateHash.toLowerCase() === originalHash.toLowerCase();
}
