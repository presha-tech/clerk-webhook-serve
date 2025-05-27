export function validatePassword(password) {
  // Example: at least 8 chars, one uppercase, one lowercase, one number
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (password.length < minLength) {
    return 'Password must be at least 8 characters long.';
  }
  if (!hasUpper) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!hasLower) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!hasNumber) {
    return 'Password must contain at least one number.';
  }
  return null; // valid
}