const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateTokens, verifyRefreshToken } = require('../utils/tokenHelpers');
const catchAsync = require('../utils/catchAsync');

const prisma = new PrismaClient();

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
});

const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token' });
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const getMe = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, department: true, managerId: true }
  });
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  res.status(200).json({ success: true, user });
});

module.exports = { login, refresh, logout, getMe };
