export function hasRepeatedConsecutiveDigits(
  value: string,
  minimumRepeat = 4,
): boolean {
  if (!value) {
    return false;
  }

  return new RegExp(`(\\d)\\1{${minimumRepeat - 1},}`).test(value);
}