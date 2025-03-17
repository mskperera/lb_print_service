const express = require('express');
const { 
  validateClient_ctrl, 
  addClient_ctrl, 
  deleteClientById_ctrl, 
  getClientById_ctrl, 
  getAllClients_ctrl, 
  getClientByFrontendId_ctrl
} = require('../controller/printdesk');

const router = express.Router();

// Validate client by printdeskId
router.get('/printdesks/validate/:printdeskId', validateClient_ctrl);

// Add a new client
router.post('/printdesks/add', addClient_ctrl);

// Delete a client by _id
router.delete('/printdesks/delete/:id', deleteClientById_ctrl);

// Get a client by _id (fixed missing '/')
router.get('/printdesksById/:id', getClientById_ctrl);

router.get('/printdesks/:id', getClientByFrontendId_ctrl);


// Get all clients
//router.get('/printdesks', getAllClients_ctrl);

module.exports = router;