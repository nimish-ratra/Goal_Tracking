const { Client } = require('@microsoft/microsoft-graph-client');
const { PrismaClient } = require('@prisma/client');
const { generateTokens } = require('../utils/tokenHelpers');

const prisma = new PrismaClient();

const handleAzureSSO = async (req, res) => {
  try {
    const { accessToken, account } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token is required' });
    }

    // 1. Verify token with Graph API
    const graphClient = Client.init({
      authProvider: (done) => done(null, accessToken)
    });

    const graphUser = await graphClient.api('/me').get();
    const graphGroups = await graphClient.api('/me/memberOf').get();
    const graphManager = await graphClient.api('/me/manager').get().catch(() => null);

    // 2. Determine role from group membership
    const groupIds = graphGroups.value.map(g => g.id);
    let role = 'EMPLOYEE';
    if (groupIds.includes(process.env.AZURE_GROUP_ADMIN)) role = 'ADMIN';
    else if (groupIds.includes(process.env.AZURE_GROUP_MANAGER)) role = 'MANAGER';

    // 3. Upsert user in database
    const email = graphUser.mail || graphUser.userPrincipalName;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Could not extract email from Azure AD' });
    }

    let user = await prisma.user.upsert({
      where: { email },
      update: {
        name: graphUser.displayName,
        role,
        azureOid: graphUser.id,
        department: graphUser.department,
        ssoProvider: 'azure'
      },
      create: {
        email,
        name: graphUser.displayName,
        role,
        azureOid: graphUser.id,
        department: graphUser.department,
        passwordHash: '', // No password for SSO users
        ssoProvider: 'azure'
      },
    });

    // 4. Sync manager relationship
    if (graphManager) {
      const managerEmail = graphManager.mail || graphManager.userPrincipalName;
      if (managerEmail) {
        const managerUser = await prisma.user.findUnique({
          where: { email: managerEmail }
        });
        if (managerUser) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { managerId: managerUser.id }
          });
        }
      }
    }

    // 5. Issue our own JWT tokens
    const { accessToken: accessJwt, refreshToken: refreshJwt } = generateTokens(user);
    
    res.cookie('accessToken', accessJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie('refreshToken', refreshJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Sanitize user before returning
    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };

    return res.json({ success: true, user: sanitizedUser });
  } catch (error) {
    console.error('Azure SSO Error:', error);
    res.status(500).json({ success: false, message: 'Authentication with Azure failed' });
  }
};

module.exports = { handleAzureSSO };
