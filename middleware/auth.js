import { verifyToken } from '../utils/jwt.js';

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.isAuthenticated = false;
    console.log('No token provided');
    return next();// Redirect to login if no token is found
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    req.isAuthenticated = false;
    console.log('Token invalid');
    return next(); // Redirect to login if token is invalid
  }

  req.isAuthenticated = true;
  req.user = decoded;
  console.log('User authenticated');
  next();
};

export default authMiddleware;

