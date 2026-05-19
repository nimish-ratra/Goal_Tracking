const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const pushSharedGoal = catchAsync(async (req, res) => {
  const { title, thrustArea, uom, target, description, recipientIds, cycleId } = req.body;
  
  const sharedGroupId = uuidv4();

  // Create the primary goal (owned by the pusher, usually an admin or manager)
  const primaryGoal = await prisma.goal.create({
    data: {
      ownerId: req.user.id,
      cycleId,
      thrustArea,
      title,
      description,
      uom,
      target,
      weightage: 0, // Primary might not need weightage if it's just a template, but let's give it 0 or 10.
      status: 'APPROVED', // Templates shouldn't block submission
      isShared: true,
      sharedGroupId,
    }
  });

  // Create duplicate goals for each recipient linked by sharedGroupId
  for (const recipientId of recipientIds) {
    await prisma.goal.create({
      data: {
        ownerId: recipientId,
        cycleId,
        thrustArea,
        title,
        description,
        uom,
        target,
        weightage: 10, // Default minimum weightage
        status: 'DRAFT',
        isShared: true,
        sharedGroupId,
      }
    });

    await prisma.sharedGoalRecipient.create({
      data: {
        goalId: primaryGoal.id,
        recipientId: recipientId,
        weightage: 10
      }
    });
  }

  res.status(200).json({ success: true, message: 'Shared goal pushed successfully' });
});

const updateSharedWeightage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { weightage } = req.body;

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.ownerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  if (weightage < 10) {
    return res.status(400).json({ success: false, message: 'Min 10% weightage' });
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: { weightage }
  });

  res.status(200).json({ success: true, data: updated });
});

const syncAchievement = catchAsync(async (req, res) => {
  const { sharedGroupId } = req.params;
  
  // Find all goals in this group
  const goals = await prisma.goal.findMany({ where: { sharedGroupId }, include: { quarterlyData: true } });
  if (goals.length === 0) return res.status(404).json({ success: false, message: 'Group not found' });

  // Assume the original owner is the one who updated it
  // In a real app, we'd identify the source. Here we just take the first completed one.
  const sourceGoal = goals.find(g => g.quarterlyData.length > 0);
  if (!sourceGoal) return res.status(400).json({ success: false, message: 'No achievement data to sync' });

  for (const qd of sourceGoal.quarterlyData) {
    for (const goal of goals) {
      if (goal.id === sourceGoal.id) continue;
      
      await prisma.quarterlyData.upsert({
        where: { goalId_quarterId: { goalId: goal.id, quarterId: qd.quarterId } },
        update: { actual: qd.actual, score: qd.score, progressStatus: qd.progressStatus, completionDate: qd.completionDate },
        create: {
          goalId: goal.id,
          quarterId: qd.quarterId,
          actual: qd.actual,
          score: qd.score,
          progressStatus: qd.progressStatus,
          completionDate: qd.completionDate,
          submittedAt: new Date()
        }
      });
    }
  }

  res.status(200).json({ success: true, message: 'Achievements synced' });
});

module.exports = { pushSharedGoal, updateSharedWeightage, syncAchievement };
