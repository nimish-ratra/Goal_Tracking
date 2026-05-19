const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.quarterlyData.deleteMany();
  await prisma.sharedGoalRecipient.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.quarter.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const employeePassword = await bcrypt.hash('Employee@123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@company.com',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Engineering Manager',
      email: 'manager@company.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
      department: 'Engineering',
    },
  });

  const employee = await prisma.user.create({
    data: {
      name: 'Software Engineer',
      email: 'employee@company.com',
      passwordHash: employeePassword,
      role: 'EMPLOYEE',
      department: 'Engineering',
      managerId: manager.id,
    },
  });

  // 2. Create Active Cycle
  // Calculate dynamic dates relative to today
  const today = new Date();
  
  // Setting Open: 15 days ago, Close: 15 days from now
  const settingOpen = new Date(today);
  settingOpen.setDate(today.getDate() - 15);
  
  const settingClose = new Date(today);
  settingClose.setDate(today.getDate() + 15);

  const cycle = await prisma.cycle.create({
    data: {
      year: today.getFullYear(),
      label: `FY ${today.getFullYear()}-${today.getFullYear() + 1}`,
      isActive: true,
      settingOpen,
      settingClose,
    },
  });

  // 3. Create Quarters
  // Q1 will span current date so it's always open for demo purposes
  const q1Open = new Date(today);
  q1Open.setDate(today.getDate() - 10); // Opened 10 days ago
  const q1Close = new Date(today);
  q1Close.setDate(today.getDate() + 20); // Closes 20 days from now

  const q2Open = new Date(q1Close);
  q2Open.setDate(q1Close.getDate() + 60);
  const q2Close = new Date(q2Open);
  q2Close.setDate(q2Open.getDate() + 30);

  const q3Open = new Date(q2Close);
  q3Open.setDate(q2Close.getDate() + 60);
  const q3Close = new Date(q3Open);
  q3Close.setDate(q3Open.getDate() + 30);

  const q4Open = new Date(q3Close);
  q4Open.setDate(q3Close.getDate() + 60);
  const q4Close = new Date(q4Open);
  q4Close.setDate(q4Open.getDate() + 30);

  const q1 = await prisma.quarter.create({
    data: { cycleId: cycle.id, label: 'Q1', windowOpen: q1Open, windowClose: q1Close },
  });
  const q2 = await prisma.quarter.create({
    data: { cycleId: cycle.id, label: 'Q2', windowOpen: q2Open, windowClose: q2Close },
  });
  const q3 = await prisma.quarter.create({
    data: { cycleId: cycle.id, label: 'Q3', windowOpen: q3Open, windowClose: q3Close },
  });
  const q4 = await prisma.quarter.create({
    data: { cycleId: cycle.id, label: 'Q4', windowOpen: q4Open, windowClose: q4Close },
  });

  // 4. Create Sample Goals for Employee
  await prisma.goal.create({
    data: {
      ownerId: employee.id,
      cycleId: cycle.id,
      thrustArea: 'Engineering Excellence',
      title: 'Reduce API Latency',
      description: 'Optimize core database queries to reduce average response time',
      uom: 'NUMERIC_MIN',
      target: 200, // ms
      weightage: 40,
      status: 'DRAFT',
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: employee.id,
      cycleId: cycle.id,
      thrustArea: 'Innovation',
      title: 'Launch New Feature X',
      description: 'End-to-end delivery of the new feature',
      uom: 'TIMELINE',
      target: 1, 
      weightage: 40,
      status: 'DRAFT',
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: employee.id,
      cycleId: cycle.id,
      thrustArea: 'Quality',
      title: 'Zero P0 Bugs in Production',
      description: 'Maintain high quality bar for all releases',
      uom: 'ZERO',
      target: 0,
      weightage: 20,
      status: 'DRAFT',
    },
  });

  console.log('Seed executed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
