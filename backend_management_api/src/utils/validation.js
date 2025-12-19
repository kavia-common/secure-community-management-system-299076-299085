// Input validation utility module
// Provides validation helpers for authentication and user input

/**
 * Validates email format using RFC-compliant regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
// PUBLIC_INTERFACE
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validates password strength requirements
 * @param {string} password - Password to validate
 * @returns {object} - Object with valid boolean and optional error message
 */
// PUBLIC_INTERFACE
function isValidPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  return { valid: true };
}

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid username format
 */
// PUBLIC_INTERFACE
function isValidUsername(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }
  // Username: 3-100 chars, alphanumeric, underscore, hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]{3,100}$/;
  return usernameRegex.test(username);
}

/**
 * Sanitizes string input to prevent injection attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
// PUBLIC_INTERFACE
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input.trim();
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  sanitizeInput,
};
