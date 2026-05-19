const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('./emailService');
const { sendTeamsCard } = require('./teamsService');

const prisma = new PrismaClient();

async function runEscalations() {
  console.log('[Escalation Engine] Starting daily check...');
  
  const rules = await prisma.escalationRule.findMany({ where: { isActive: true } });
  if (rules.length === 0) return;

  const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!activeCycle) return;

  const now = new Date();

  for (const rule of rules) {
    if (rule.triggerType === 'GOAL_NOT_SUBMITTED') {
      await processGoalNotSubmitted(rule, activeCycle, now);
    } else if (rule.triggerType === 'GOAL_NOT_APPROVED') {
      await processGoalNotApproved(rule, activeCycle, now);
    } else if (rule.triggerType === 'CHECKIN_NOT_COMPLETED') {
      await processCheckinNotCompleted(rule, activeCycle, now);
    }
  }
}

async function processGoalNotSubmitted(rule, cycle, now) {
  // Trigger: Employee hasn't submitted within N days of cycle open
  const delayMs = rule.delayDays * 24 * 60 * 60 * 1000;
  if (now.getTime() - cycle.settingOpen.getTime() < delayMs) return; // Not overdue yet

  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: { manager: { include: { manager: true } } } // up to skip-level
  });

  for (const emp of employees) {
    const goals = await prisma.goal.findMany({ where: { ownerId: emp.id, cycleId: cycle.id } });
    const hasSubmitted = goals.length > 0 && goals.every(g => g.status !== 'DRAFT' && g.status !== 'RETURNED');
    
    if (!hasSubmitted) {
      await triggerEscalation(rule, emp, emp.manager, cycle.id, null, 'Goal submission overdue');
    }
  }
}

async function processGoalNotApproved(rule, cycle, now) {
  // Simplify: Find submitted goals not approved for N days
  const delayDate = new Date(now.getTime() - rule.delayDays * 24 * 60 * 60 * 1000);
  
  const goals = await prisma.goal.findMany({
    where: { cycleId: cycle.id, status: 'SUBMITTED', updatedAt: { lte: delayDate } },
    include: { owner: { include: { manager: { include: { manager: true } } } } }
  });

  const managerGroup = new Map();
  for (const g of goals) {
    if (g.owner.manager) {
      if (!managerGroup.has(g.owner.manager.id)) managerGroup.set(g.owner.manager.id, { manager: g.owner.manager, empIds: new Set() });
      managerGroup.get(g.owner.manager.id).empIds.add(g.owner.id);
    }
  }

  for (const [mgrId, data] of managerGroup.entries()) {
    await triggerEscalation(rule, data.manager, data.manager.manager, cycle.id, null, `Manager approval overdue for ${data.empIds.size} employees`);
  }
}

async function processCheckinNotCompleted(rule, cycle, now) {
  const activeQuarter = await prisma.quarter.findFirst({
    where: { cycleId: cycle.id, windowOpen: { lte: now }, windowClose: { gte: now } }
  });
  if (!activeQuarter) return;

  const delayDate = new Date(activeQuarter.windowOpen.getTime() + rule.delayDays * 24 * 60 * 60 * 1000);
  if (now < delayDate) return;

  const goals = await prisma.goal.findMany({ where: { cycleId: cycle.id, status: 'APPROVED' }, include: { owner: { include: { manager: true } } } });
  
  const checkins = await prisma.quarterlyData.findMany({ where: { quarterId: activeQuarter.id } });
  const checkinMap = new Set(checkins.map(c => c.goalId));

  for (const goal of goals) {
    if (!checkinMap.has(goal.id)) {
      await triggerEscalation(rule, goal.owner, goal.owner.manager, cycle.id, activeQuarter.id, `Check-in overdue for Q${activeQuarter.label}`);
    }
  }
}

async function triggerEscalation(rule, targetUser, skipLevelManager, cycleId, quarterId, reason) {
  let escalateTo = null;
  if (rule.escalationLevel === 1) escalateTo = targetUser; // reminder to self
  else if (rule.escalationLevel === 2) escalateTo = targetUser.manager || targetUser; // to manager
  else if (rule.escalationLevel === 3) escalateTo = skipLevelManager || targetUser.manager || targetUser; // to skip-level
  
  if (!escalateTo) return;

  // Check if already escalated today for this rule and target
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.escalationLog.findFirst({
    where: {
      ruleId: rule.id,
      targetUserId: targetUser.id,
      createdAt: { gte: today }
    }
  });

  if (existing) return;

  await prisma.escalationLog.create({
    data: {
      ruleId: rule.id,
      targetUserId: targetUser.id,
      escalatedToId: escalateTo.id,
      triggerType: rule.triggerType,
      context: { cycleId, quarterId, reason }
    }
  });

  const bodyText = `Escalation Level ${rule.escalationLevel}: ${reason}. Action is required for ${targetUser.name}.`;

  await sendEmail({
    to: escalateTo.email,
    subject: `[AtomQuest Escalation] Action Required: ${rule.name}`,
    templateName: 'escalation',
    data: { escalateTo, body: bodyText, appUrl: process.env.APP_BASE_URL || 'http://localhost:5173' }
  });

  await sendTeamsCard({
    title: `🚨 Escalation: ${rule.name}`,
    text: bodyText,
    facts: [
      { label: 'Target', value: targetUser.name },
      { label: 'Level', value: `Level ${rule.escalationLevel}` },
      { label: 'Trigger', value: rule.triggerType.replace(/_/g, ' ') }
    ],
    actionUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
    actionLabel: 'Open Portal'
  });
}

module.exports = { runEscalations };
