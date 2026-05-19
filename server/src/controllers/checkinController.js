const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync');
const { computeScore } = require('../utils/scoreCalculator');

const prisma = new PrismaClient();
const { sendEmail } = require('../services/emailService');
const { sendTeamsCard } = require('../services/teamsService');

const getActiveQuarter = async (cycleId) => {
  const now = new Date();
  const quarters = await prisma.quarter.findMany({ where: { cycleId } });
  return quarters.find(q => now >= q.windowOpen && now <= q.windowClose);
};

const createCheckIn = catchAsync(async (req, res) => {
  const { goalId, quarterId, actual, completionDate, progressStatus } = req.body;

  const goal = await prisma.goal.findUnique({ where: { id: goalId }, include: { cycle: true } });
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

  const activeQuarter = await getActiveQuarter(goal.cycleId);
  if (!activeQuarter || activeQuarter.id !== quarterId) {
    const quarters = await prisma.quarter.findMany({ where: { cycleId: goal.cycleId }, orderBy: { windowOpen: 'asc' } });
    const nextQuarter = quarters.find(q => q.windowOpen > new Date());
    const msg = nextQuarter 
      ? `No active check-in window. The next window opens on ${nextQuarter.windowOpen.toDateString()}.` 
      : "No active check-in window.";
    return res.status(403).json({ success: false, message: msg });
  }

  // Calculate score
  const score = computeScore(goal.uom, goal.target, actual, completionDate, activeQuarter.windowClose);

  const quarterlyData = await prisma.quarterlyData.upsert({
    where: { goalId_quarterId: { goalId, quarterId } },
    update: {
      actual,
      completionDate: completionDate ? new Date(completionDate) : null,
      progressStatus,
      score,
      submittedAt: new Date()
    },
    create: {
      goalId,
      quarterId,
      actual,
      completionDate: completionDate ? new Date(completionDate) : null,
      progressStatus,
      score,
      submittedAt: new Date()
    }
  });

  try {
    const employee = await prisma.user.findUnique({ where: { id: req.user.id }, include: { manager: true } });
    if (employee && employee.manager) {
      // Send Teams Notification (email might be too much per goal, so let's stick to teams or both)
      await sendTeamsCard({
        title: `Goal Progress Updated`,
        text: `${employee.name} updated progress for goal: ${goal.title}`,
        facts: [
          { label: 'Quarter', value: activeQuarter.label },
          { label: 'Progress', value: progressStatus },
          { label: 'Actual', value: actual?.toString() || '-' },
        ],
        actionUrl: `${process.env.APP_BASE_URL || 'http://localhost:5173'}/manager/checkins/${quarterId}`,
        actionLabel: 'View Check-in',
      });
    }
  } catch (err) {
    console.error('Notification error', err);
  }

  res.status(200).json({ success: true, data: quarterlyData });
});

const getMyCheckIns = catchAsync(async (req, res) => {
  const { quarterId } = req.params;
  
  const data = await prisma.quarterlyData.findMany({
    where: {
      quarterId,
      goal: { ownerId: req.user.id }
    },
    include: { goal: true, checkIn: true }
  });

  res.status(200).json({ success: true, data });
});

const getTeamCheckIns = catchAsync(async (req, res) => {
  const { quarterId } = req.params;
  
  const team = await prisma.user.findMany({ where: { managerId: req.user.id } });
  const teamIds = team.map(t => t.id);

  const data = await prisma.quarterlyData.findMany({
    where: {
      quarterId,
      goal: { ownerId: { in: teamIds } }
    },
    include: { 
      goal: { include: { owner: { select: { id: true, name: true } } } },
      checkIn: true
    }
  });

  res.status(200).json({ success: true, data });
});

const addManagerComment = catchAsync(async (req, res) => {
  const { quarterlyDataId } = req.params;
  const { comment, quarterId } = req.body;

  if (!comment) return res.status(400).json({ success: false, message: 'Comment is required' });

  const qData = await prisma.quarterlyData.findUnique({ where: { id: quarterlyDataId }, include: { goal: true } });
  if (!qData) return res.status(404).json({ success: false, message: 'Data not found' });

  const checkIn = await prisma.checkIn.upsert({
    where: { quarterlyDataId },
    update: { comment, checkedInAt: new Date() },
    create: {
      quarterlyDataId,
      quarterId: qData.quarterId || quarterId,
      managerId: req.user.id,
      comment
    }
  });

  res.status(200).json({ success: true, data: checkIn });
});

module.exports = { createCheckIn, getMyCheckIns, getTeamCheckIns, addManagerComment };
