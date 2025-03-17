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

const getAllClients_srv = async () => {
  try {
    // Query the database to retrieve all registered clients
    const clients = await prisma.registeredClient.findMany();

    return clients;
  } catch (error) {
    console.error('Error fetching all clients:', error);
    throw error;
  }
};


const getClientById_srv = async (id) => {
  try {
    // Query the database to find the registered client by its _id
    const client = await prisma.registeredClient.findUnique({
      where: { id }, // MongoDB ObjectId is stored as a string
    });

    if (!client) {
      console.log('Client not found.');
      return null;
    }

    console.log('Client found:', client);
    return client;
  } catch (error) {
    console.error('Error fetching client by ID:', error);
    throw error;
  }
};


const getClientByFrontendId_srv = async (frontendId) => {
  try {
    // Query the database to find clients by frontendId
    const clients = await prisma.registeredClient.findMany({
      where: { frontendId }, // Assuming frontendId is not unique
    });

    if (clients.length === 0) {
      console.log('No clients found with frontendId:', frontendId);
      return null;
    }

    console.log('Clients found with frontendId:', clients);
    return clients; // You can return the first client or handle it differently
  } catch (error) {
    console.error('Error fetching clients by frontendId:', error);
    throw error;
  }
};



const addClient_srv = async (frontendId, printdeskId) => {
  try {
    const newClient = await prisma.registeredClient.create({
      data: {
        frontendId,
        printdeskId,
      },
    });
    console.log('New client added:', newClient);
    return newClient;
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
};


const deleteClientById_srv = async (id) => {
  try {
    const deletedClient = await prisma.registeredClient.delete({
      where: { id }, // MongoDB ObjectId is stored as a string
    });

    console.log('Client deleted:', deletedClient);
    return deletedClient;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};


module.exports = { validatingTheClientId,addClient_srv,getAllClients_srv,
  deleteClientById_srv,getClientById_srv,getClientByFrontendId_srv };