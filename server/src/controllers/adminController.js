const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../utils/catchAsync');

const prisma = new PrismaClient();

const getGraphClient = async () => {
  const msalConfig = {
    auth: {
      clientId: process.env.AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    }
  };

  const cca = new ConfidentialClientApplication(msalConfig);
  const authResponse = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default']
  });

  return Client.init({
    authProvider: (done) => done(null, authResponse.accessToken)
  });
};

const syncAzureOrg = catchAsync(async (req, res) => {
  const graphClient = await getGraphClient();
  
  // 1. Fetch all users from Tenant
  const usersResponse = await graphClient.api('/users').select('id,displayName,mail,userPrincipalName,department').get();
  const azureUsers = usersResponse.value;
  
  let synced = 0, created = 0, updated = 0;
  const errors = [];
  
  // 2. Fetch managers for each user
  for (const au of azureUsers) {
    try {
      const email = au.mail || au.userPrincipalName;
      if (!email) continue;
      
      const managerResponse = await graphClient.api(`/users/${au.id}/manager`).get().catch(() => null);
      
      // Upsert User
      let user = await prisma.user.upsert({
        where: { email },
        update: {
          name: au.displayName,
          azureOid: au.id,
          department: au.department,
          ssoProvider: 'azure'
        },
        create: {
          email,
          name: au.displayName,
          azureOid: au.id,
          department: au.department,
          passwordHash: '',
          role: 'EMPLOYEE', // Default, we won't sync roles here for simplicity unless requested
          ssoProvider: 'azure'
        }
      });
      
      if (user.createdAt.getTime() === user.updatedAt.getTime()) created++;
      else updated++;
      synced++;
      
      au.dbId = user.id;
      if (managerResponse) au.managerEmail = managerResponse.mail || managerResponse.userPrincipalName;
    } catch (err) {
      errors.push(`Failed to sync ${au.displayName}: ${err.message}`);
    }
  }
  
  // 3. Link Managers
  for (const au of azureUsers) {
    if (au.managerEmail && au.dbId) {
      const manager = await prisma.user.findUnique({ where: { email: au.managerEmail } });
      if (manager) {
        await prisma.user.update({
          where: { id: au.dbId },
          data: { managerId: manager.id }
        });
      }
    }
  }
  
  res.status(200).json({ success: true, synced, created, updated, errors });
});

module.exports = { syncAzureOrg };
