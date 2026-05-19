const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync');

const { sendEmail } = require('../services/emailService');
const { sendTeamsCard } = require('../services/teamsService');

const getGoals = catchAsync(async (req, res) => {
  const { cycleId } = req.query;
  const user = req.user;

  let query = { where: {} };
  if (cycleId) {
    query.where.cycleId = cycleId;
  } else {
    const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (activeCycle) {
      query.where.cycleId = activeCycle.id;
    }
  }

  if (user.role === 'EMPLOYEE') {
    query.where.ownerId = user.id;
  } else if (user.role === 'MANAGER') {
    const team = await prisma.user.findMany({ where: { managerId: user.id }, select: { id: true } });
    const teamIds = team.map(t => t.id);
    teamIds.push(user.id);
    query.where.ownerId = { in: teamIds };
  }

  const goals = await prisma.goal.findMany({
    where: query.where,
    include: {
      owner: { select: { id: true, name: true, department: true } },
      cycle: { select: { id: true, label: true } },
      quarterlyData: true,
      sharedRecipients: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ success: true, count: goals.length, data: goals });
});

const getGoal = catchAsync(async (req, res) => {
  const goal = await prisma.goal.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true } },
      quarterlyData: true,
      sharedRecipients: true,
      auditLogs: { orderBy: { timestamp: 'desc' } }
    }
  });

  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
  res.status(200).json({ success: true, data: goal });
});

const createGoal = catchAsync(async (req, res) => {
  const { cycleId, thrustArea, title, description, uom, target, weightage } = req.body;
  const ownerId = req.user.id;

  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!cycle || !cycle.isActive) {
    return res.status(400).json({ success: false, message: 'Invalid or inactive cycle' });
  }

  const now = new Date();
  if (now < cycle.settingOpen || now > cycle.settingClose) {
    return res.status(403).json({ success: false, message: 'Goal setting window is closed' });
  }

  const currentGoals = await prisma.goal.count({ where: { ownerId, cycleId } });
  if (currentGoals >= 8) {
    return res.status(400).json({ success: false, message: 'Maximum 8 goals allowed per cycle' });
  }

  if (weightage < 10) {
    return res.status(400).json({ success: false, message: 'Minimum 10% weightage required' });
  }

  const goal = await prisma.goal.create({
    data: {
      ownerId,
      cycleId,
      thrustArea,
      title,
      description,
      uom,
      target,
      weightage,
      status: 'DRAFT'
    }
  });

  res.status(201).json({ success: true, data: goal });
});

const updateGoal = catchAsync(async (req, res) => {
  const { title, thrustArea, description, uom, target, weightage } = req.body;
  const goalId = req.params.id;

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

  if (req.user.role === 'EMPLOYEE' && goal.status !== 'DRAFT' && goal.status !== 'RETURNED') {
    return res.status(403).json({ success: false, message: 'Cannot edit non-draft goals' });
  }

  if (req.user.role === 'MANAGER' && goal.status !== 'SUBMITTED') {
    return res.status(403).json({ success: false, message: 'Can only edit submitted goals during approval' });
  }

  if (goal.isLocked) {
    return res.status(403).json({ success: false, message: 'Goal is locked' });
  }

  const updatedGoal = await prisma.goal.update({
    where: { id: goalId },
    data: { title, thrustArea, description, uom, target, weightage }
  });

  res.status(200).json({ success: true, data: updatedGoal });
});

const deleteGoal = catchAsync(async (req, res) => {
  const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

  if (req.user.role === 'EMPLOYEE' && goal.status !== 'DRAFT' && goal.status !== 'RETURNED') {
    return res.status(403).json({ success: false, message: 'Can only delete draft goals' });
  }

  await prisma.goal.delete({ where: { id: req.params.id } });
  res.status(200).json({ success: true, message: 'Goal deleted' });
});

const submitGoalSheet = catchAsync(async (req, res) => {
  let { cycleId } = req.body;
  const ownerId = req.user.id;

  if (!cycleId) {
    const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!activeCycle) return res.status(400).json({ success: false, message: 'No active cycle found' });
    cycleId = activeCycle.id;
  }

  const goals = await prisma.goal.findMany({ where: { ownerId, cycleId } });
  
  if (goals.length > 8) {
    return res.status(400).json({ success: false, message: `Maximum 8 goals allowed.` });
  }

  const hasInvalidWeightage = goals.some(g => g.weightage < 10);
  if (hasInvalidWeightage) {
    return res.status(400).json({ success: false, message: `All goals must have at least 10% weightage.` });
  }

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (totalWeightage !== 100) {
    return res.status(400).json({ success: false, message: `Total weightage must be exactly 100%. Current: ${totalWeightage}%` });
  }

  await prisma.goal.updateMany({
    where: { ownerId, cycleId, status: { in: ['DRAFT', 'RETURNED'] } },
    data: { status: 'SUBMITTED' }
  });

  try {
    const employee = await prisma.user.findUnique({ where: { id: ownerId }, include: { manager: true } });
    if (employee && employee.manager) {
      const cycleLabel = activeCycle ? activeCycle.label : '';
      
      await sendEmail({
        to: employee.manager.email,
        subject: `[Action Required] ${employee.name} submitted their goals`,
        templateName: 'goal-submitted',
        data: { 
          employeeName: employee.name, 
          department: employee.department || 'their department', 
          cycleLabel, 
          goals, 
          employeeId: employee.id, 
          appUrl: process.env.APP_BASE_URL || 'http://localhost:5173'
        }
      });

      await sendTeamsCard({
        title: `${employee.name} submitted their goal sheet`,
        text: `Review and approve their goals for ${cycleLabel}.`,
        facts: [
          { label: 'Employee', value: employee.name },
          { label: 'Department', value: employee.department || '-' },
          { label: 'Goals', value: `${goals.length} goals, 100% weighted` },
          { label: 'Submitted', value: new Date().toLocaleDateString() },
        ],
        actionUrl: `${process.env.APP_BASE_URL || 'http://localhost:5173'}/manager/approve/${employee.id}`,
        actionLabel: 'Review Goals',
      });
    }
  } catch (err) {
    console.error('Error sending notification', err);
  }

  res.status(200).json({ success: true, message: 'Goal sheet submitted' });
});

const approveGoal = catchAsync(async (req, res) => {
  // params.id is employeeId
  const employeeId = req.params.id;
  
  const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!activeCycle) return res.status(400).json({ success: false, message: 'No active cycle found' });

  // Verify total weightage is 100%
  const goals = await prisma.goal.findMany({ where: { ownerId: employeeId, cycleId: activeCycle.id } });
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (totalWeightage !== 100) {
    return res.status(400).json({ success: false, message: `Cannot approve: Total weightage is ${totalWeightage}%` });
  }

  await prisma.goal.updateMany({
    where: { ownerId: employeeId, cycleId: activeCycle.id, status: 'SUBMITTED' },
    data: { status: 'APPROVED', isLocked: true }
  });

  const updatedGoals = await prisma.goal.findMany({ where: { ownerId: employeeId, cycleId: activeCycle.id } });
  
  // Bulk create audit logs
  await prisma.auditLog.createMany({
    data: updatedGoals.map(g => ({
      goalId: g.id,
      userId: req.user.id,
      action: 'GOAL_APPROVED',
      timestamp: new Date()
    }))
  });

  try {
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    const manager = req.user;
    
    await sendEmail({ 
      to: employee.email, 
      subject: `✅ Your goals have been approved for ${activeCycle.label}`,
      templateName: 'goal-approved', 
      data: { 
        managerName: manager.name,
        cycleLabel: activeCycle.label,
        appUrl: process.env.APP_BASE_URL || 'http://localhost:5173'
      } 
    });

    await sendTeamsCard({
      title: '✅ Your goals have been approved',
      text: `${manager.name} approved your goal sheet for ${activeCycle.label}.`,
      facts: [
        { label: 'Manager', value: manager.name },
        { label: 'Cycle', value: activeCycle.label }
      ],
      actionUrl: `${process.env.APP_BASE_URL || 'http://localhost:5173'}/employee/goals`,
      actionLabel: 'View My Goals',
    });
  } catch (err) {
    console.error('Error sending notification', err);
  }

  res.status(200).json({ success: true, message: 'All submitted goals approved' });
});

const returnGoal = catchAsync(async (req, res) => {
  // params.id is employeeId
  const employeeId = req.params.id;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ success: false, message: 'Return comment is required' });
  }

  const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!activeCycle) return res.status(400).json({ success: false, message: 'No active cycle' });

  await prisma.goal.updateMany({
    where: { ownerId: employeeId, cycleId: activeCycle.id, status: 'SUBMITTED' },
    data: { status: 'RETURNED', returnComment: comment }
  });

  const updatedGoals = await prisma.goal.findMany({ where: { ownerId: employeeId, cycleId: activeCycle.id } });

  await prisma.auditLog.createMany({
    data: updatedGoals.map(g => ({
      goalId: g.id,
      userId: req.user.id,
      action: 'GOAL_RETURNED',
      reason: comment,
      timestamp: new Date()
    }))
  });

  try {
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    const manager = req.user;
    
    await sendEmail({ 
      to: employee.email, 
      subject: `⚠️ Your goals need revision — feedback from ${manager.name}`,
      templateName: 'goal-returned', 
      data: { 
        managerName: manager.name, 
        returnComment: comment, 
        cycleLabel: activeCycle.label,
        appUrl: process.env.APP_BASE_URL || 'http://localhost:5173'
      } 
    });

    await sendTeamsCard({
      title: '⚠️ Your goals need revision',
      text: `${manager.name} returned your goal sheet with feedback.`,
      facts: [
        { label: 'Feedback', value: comment }
      ],
      actionUrl: `${process.env.APP_BASE_URL || 'http://localhost:5173'}/employee/goals`,
      actionLabel: 'Revise Goals',
    });
  } catch (err) {
    console.error('Error sending notification', err);
  }

  res.status(200).json({ success: true, message: 'Goals returned for rework' });
});

const unlockGoal = catchAsync(async (req, res) => {
  const goalId = req.params.id;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Unlock reason is required' });
  }

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { isLocked: false, status: 'DRAFT' }
  });

  await prisma.auditLog.create({
    data: {
      goalId: goal.id,
      userId: req.user.id,
      action: 'GOAL_UNLOCKED',
      reason: reason,
      timestamp: new Date()
    }
  });

  res.status(200).json({ success: true, data: goal });
});

module.exports = {
  getGoals, getGoal, createGoal, updateGoal, deleteGoal,
  submitGoalSheet, approveGoal, returnGoal, unlockGoal
};
