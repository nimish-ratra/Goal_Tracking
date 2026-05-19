const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');

const prisma = new PrismaClient();

const getUsers = catchAsync(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, department: true,
      manager: { select: { id: true, name: true } }
    }
  });
  res.status(200).json({ success: true, data: users });
});

const createUser = catchAsync(async (req, res) => {
  const { name, email, password, role, department, managerId } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });

  const passwordHash = await bcrypt.hash(password || 'Password@123', 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, department, managerId }
  });

  res.status(201).json({ success: true, data: user });
});

const updateUser = catchAsync(async (req, res) => {
  const { role, department, managerId } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role, department, managerId }
  });
  res.status(200).json({ success: true, data: user });
});

const getTeam = catchAsync(async (req, res) => {
  const team = await prisma.user.findMany({
    where: { managerId: req.user.id },
    select: { id: true, name: true, email: true, department: true }
  });
  res.status(200).json({ success: true, data: team });
});

module.exports = { getUsers, createUser, updateUser, getTeam };
