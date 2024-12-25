const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const validatingTheClientId = async (printDeskId) => {
  // Query the database to find the registered clients with the matching printdeskId
  const matchedClients = await prisma.registeredClient.findMany({
    where: {
      printdeskId: printDeskId,
    },
    select: {
      frontendId: true,
    },
  });

  // Return the array of frontendIds
  return matchedClients.map(client => client.frontendId);
};

module.exports = { validatingTheClientId };