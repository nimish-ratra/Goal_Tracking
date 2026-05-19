const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const catchAsync = require('../utils/catchAsync');

const prisma = new PrismaClient();

const getAchievementData = async (query) => {
  const { cycleId, quarterId, departmentId } = query;
  
  const whereClause = {};
  if (cycleId) whereClause.cycleId = cycleId;
  if (departmentId) whereClause.owner = { department: departmentId };

  const goals = await prisma.goal.findMany({
    where: whereClause,
    include: {
      owner: { select: { id: true, name: true, department: true } },
      quarterlyData: {
        where: quarterId ? { quarterId } : undefined
      }
    }
  });

  return goals;
};

const getAchievementReport = catchAsync(async (req, res) => {
  const goals = await getAchievementData(req.query);
  res.status(200).json({ success: true, count: goals.length, data: goals });
});

const exportAchievementReport = catchAsync(async (req, res) => {
  const goals = await getAchievementData(req.query);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Achievements');

  worksheet.columns = [
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Goal Title', key: 'title', width: 30 },
    { header: 'Thrust Area', key: 'thrustArea', width: 20 },
    { header: 'UoM', key: 'uom', width: 15 },
    { header: 'Target', key: 'target', width: 15 },
    { header: 'Actual (Latest)', key: 'actual', width: 15 },
    { header: 'Score', key: 'score', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  goals.forEach(g => {
    // If there's quarterly data, pick the first/latest, otherwise blank
    const qd = g.quarterlyData.length > 0 ? g.quarterlyData[0] : {};
    worksheet.addRow({
      employee: g.owner.name,
      department: g.owner.department,
      title: g.title,
      thrustArea: g.thrustArea,
      uom: g.uom,
      target: g.target,
      actual: qd.actual || 'N/A',
      score: qd.score !== null ? (qd.score * 100).toFixed(2) + '%' : 'N/A',
      status: qd.progressStatus || 'NOT_STARTED'
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=' + 'achievement_report.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});

const getCompletionReport = catchAsync(async (req, res) => {
  // Returns checkin completion rates per employee and manager
  const { quarterId } = req.query;

  const users = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: {
      manager: { select: { name: true } },
      goals: {
        include: { quarterlyData: { where: { quarterId } } }
      }
    }
  });

  const report = users.map(u => {
    const totalGoals = u.goals.length;
    const completedCheckIns = u.goals.filter(g => g.quarterlyData.length > 0).length;
    return {
      employee: u.name,
      manager: u.manager?.name || 'N/A',
      totalGoals,
      completedCheckIns,
      completionRate: totalGoals ? (completedCheckIns / totalGoals) : 0
    };
  });

  res.status(200).json({ success: true, data: report });
});

const getAuditLogs = catchAsync(async (req, res) => {
  const { goalId, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

  const where = {};
  if (goalId) where.goalId = goalId;
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const logs = await prisma.auditLog.findMany({
    where,
    skip,
    take: parseInt(limit),
    include: { user: { select: { name: true } } },
    orderBy: { timestamp: 'desc' }
  });

  const total = await prisma.auditLog.count({ where });

  res.status(200).json({ success: true, total, data: logs });
});

const getDashboardAnalytics = catchAsync(async (req, res) => {
  const { cycleId } = req.query;

  let activeCycleId = cycleId;
  if (!activeCycleId) {
    const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (cycle) activeCycleId = cycle.id;
  }

  if (!activeCycleId) {
    return res.status(200).json({ success: true, data: { statusDistribution: [], departmentDistribution: [], thrustAreaDistribution: [] } });
  }

  const goals = await prisma.goal.findMany({
    where: { cycleId: activeCycleId },
    include: { owner: true }
  });

  // Status Distribution
  const statusCounts = {};
  // Department Distribution (of goals)
  const deptCounts = {};
  // Thrust Area Distribution
  const thrustCounts = {};

  goals.forEach(g => {
    statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
    const dept = g.owner.department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    thrustCounts[g.thrustArea] = (thrustCounts[g.thrustArea] || 0) + 1;
  });

  const statusDistribution = Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] }));
  const departmentDistribution = Object.keys(deptCounts).map(k => ({ name: k, value: deptCounts[k] }));
  const thrustAreaDistribution = Object.keys(thrustCounts).map(k => ({ name: k, value: thrustCounts[k] }));

  res.status(200).json({
    success: true,
    data: {
      statusDistribution,
      departmentDistribution,
      thrustAreaDistribution
    }
  });
});

module.exports = { getAchievementReport, exportAchievementReport, getCompletionReport, getAuditLogs, getDashboardAnalytics };
