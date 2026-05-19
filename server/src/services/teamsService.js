async function sendTeamsCard({ title, text, facts, actionUrl, actionLabel }) {
  if (process.env.TEAMS_NOTIFICATIONS_ENABLED !== 'true') return;

  const card = {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'Container',
            style: 'emphasis',
            items: [{
              type: 'TextBlock',
              text: '⚡ AtomQuest Goal Tracker',
              weight: 'Bolder',
              size: 'Small',
              color: 'Accent'
            }]
          },
          {
            type: 'TextBlock',
            text: title,
            weight: 'Bolder',
            size: 'Medium',
            wrap: true
          },
          {
            type: 'TextBlock',
            text,
            wrap: true,
            color: 'Default',
            spacing: 'None'
          },
          {
            type: 'FactSet',
            facts: facts.map(f => ({ title: f.label, value: f.value }))
          }
        ],
        actions: actionUrl ? [{
          type: 'Action.OpenUrl',
          title: actionLabel || 'Open in AtomQuest',
          url: actionUrl,
          style: 'positive'
        }] : []
      }
    }]
  };

  try {
    const fetch = (await import('node-fetch')).default;
    await fetch(process.env.TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
  } catch (error) {
    console.error(`[Teams Failed] Title: ${title}`, error);
  }
}

module.exports = { sendTeamsCard };
