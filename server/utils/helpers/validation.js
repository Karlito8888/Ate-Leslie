/**
 * Validates a password based on the following criteria:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param {string} password - The password to validate
 * @returns {boolean} - true if the password is valid, false otherwise
 */
export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar;
};

/**
 * Validates an email address format
 * 
 * @param {string} email - The email to validate
 * @returns {boolean} - true if the email is valid, false otherwise
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates a username based on the following criteria:
 * - Between 3 and 30 characters
 * - Only alphanumeric characters and underscores
 * - Must start with a letter
 * 
 * @param {string} username - The username to validate
 * @returns {boolean} - true if the username is valid, false otherwise
 */
export const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/;
    return usernameRegex.test(username);
};
