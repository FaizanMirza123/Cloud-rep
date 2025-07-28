export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    error: emailRegex.test(email) ? null : "Please enter a valid email address"
  };
};

export const validatePhoneNumber = (phone) => {
  // Accepts US and international formats, trims input, and checks digit count
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: "Please enter a valid phone number" };
  }
  const trimmed = phone.trim();
  // Allow: +, digits, spaces, dashes, parentheses
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  const cleanPhone = trimmed.replace(/\D/g, "");
  // Accept 10-15 digits (US/international)
  const validLength = cleanPhone.length >= 10 && cleanPhone.length <= 15;
  const validChars = phoneRegex.test(trimmed);
  return {
    isValid: validChars && validLength,
    error: validChars && validLength ? null : "Please enter a valid phone number"
  };
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Only format if user input is a complete US number (10 digits, no formatting chars)
  if (cleaned.length === 10 && phone.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  // For international numbers, only add + if not present and input is complete (more than 10 digits, no formatting chars)
  if (cleaned.length > 10 && phone.length === cleaned.length && !phone.startsWith("+")) {
    return `+${cleaned}`;
  }
  // Otherwise, return as typed (let user edit naturally)
  return phone;
};


export const getPasswordStrength = (password) => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  const strength = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"][Math.min(score, 5)];
  const color = ["text-red-500", "text-red-400", "text-yellow-500", "text-yellow-400", "text-green-500", "text-green-600"][Math.min(score, 5)];
  
  return {
    score,
    strength,
    color,
    percentage: (score / 6) * 100
  };
};
