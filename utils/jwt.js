import jwt from 'jsonwebtoken';

const secret = 'EXAMAKER LTD SECRET CODE KM'; 
/**
 * Generates a JWT token for a user.
 * @param {Object} user - The user object containing user details.
 * @returns {string} - The generated JWT token.
 */
export const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '1h' });
};

/**
 * Verifies a JWT token.
 * @param {string} token 
 * @returns {Object|null} 
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

