const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync');

const prisma = new PrismaClient();

const getCycles = catchAsync(async (req, res) => {
  const cycles = await prisma.cycle.findMany({ include: { quarters: true } });
  res.status(200).json({ success: true, data: cycles });
});

const getActiveCycle = catchAsync(async (req, res) => {
  const cycle = await prisma.cycle.findFirst({
    where: { isActive: true },
    include: { quarters: true }
  });

  if (!cycle) return res.status(404).json({ success: false, message: 'No active cycle found' });

  const now = new Date();
  const activeQuarter = cycle.quarters.find(q => now >= q.windowOpen && now <= q.windowClose);
  
  let phase = "CLOSED";
  if (now >= cycle.settingOpen && now <= cycle.settingClose) {
    phase = "GOAL_SETTING";
  } else if (activeQuarter) {
    phase = "CHECKIN";
  }

  res.status(200).json({ success: true, data: { cycle, activeQuarter, phase } });
});

const createCycle = catchAsync(async (req, res) => {
  const { year, label, settingOpen, settingClose, quarters } = req.body;

  const cycle = await prisma.cycle.create({
    data: {
      year, label, settingOpen: new Date(settingOpen), settingClose: new Date(settingClose),
      quarters: {
        create: quarters.map(q => ({
          label: q.label,
          windowOpen: new Date(q.windowOpen),
          windowClose: new Date(q.windowClose)
        }))
      }
    },
    include: { quarters: true }
  });

  res.status(201).json({ success: true, data: cycle });
});

const activateCycle = catchAsync(async (req, res) => {
  // Deactivate all first
  await prisma.cycle.updateMany({ data: { isActive: false } });

  // Activate requested
  const cycle = await prisma.cycle.update({
    where: { id: req.params.id },
    data: { isActive: true }
  });

  res.status(200).json({ success: true, data: cycle });
});

const getQuarters = catchAsync(async (req, res) => {
  const quarters = await prisma.quarter.findMany({ where: { cycleId: req.params.id } });
  res.status(200).json({ success: true, data: quarters });
});

module.exports = { getCycles, getActiveCycle, createCycle, activateCycle, getQuarters };
