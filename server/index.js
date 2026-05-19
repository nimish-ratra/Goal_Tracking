require('dotenv').config();
const app = require('./src/app');
const cron = require('node-cron');
const { runEscalations } = require('./src/services/escalationService');

const PORT = process.env.PORT || 3001;

// Run escalations every day at 8:00 AM
cron.schedule('0 8 * * *', () => {
  console.log('Running daily escalation checks...');
  runEscalations();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
