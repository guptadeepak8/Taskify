const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email || email.trim() === '') {
    return 'Email address is required';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length === 0) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword || confirmPassword.length === 0) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}

export function validateName(name: string, required = false): string | null {
  if (!name || name.trim().length === 0) {
    return required ? 'Full name is required' : null;
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  return null;
}

export const INDIAN_PHONE_REGEX = /^(?:\+91|91)?[-.\s]?[6-9]\d{9}$/;

export function validateIndianPhone(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return 'Mobile number is required';
  }
  if (!INDIAN_PHONE_REGEX.test(phone.trim())) {
    return 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
  }
  return null;
}

export function validateAddress(address: string): string | null {
  if (!address || address.trim() === '') {
    return 'Address is required';
  }
  if (address.trim().length < 5) {
    return 'Address must be at least 5 characters';
  }
  return null;
}
