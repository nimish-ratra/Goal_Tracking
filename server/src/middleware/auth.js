const { verifyAccessToken } = require('../utils/tokenHelpers');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    const decoded = verifyAccessToken(token);
    
    // We can also fetch the full user if needed, but for efficiency just pass the decoded token
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

module.exports = { authenticate };
