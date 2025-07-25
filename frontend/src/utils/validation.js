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
  // Basic phone validation - accepts international format
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  const minLength = 10;
  const cleanPhone = phone.replace(/\D/g, "");
  
  return {
    isValid: phoneRegex.test(phone) && cleanPhone.length >= minLength,
    error: phoneRegex.test(phone) && cleanPhone.length >= minLength 
      ? null 
      : "Please enter a valid phone number"
  };
};

export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Format as +1 (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // For international numbers, just add + if not present
  if (cleaned.length > 10 && !phone.startsWith("+")) {
    return `+${cleaned}`;
  }
  
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
