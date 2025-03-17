const { validatingTheClientId, addClient_srv, deleteClientById_srv, getClientById_srv, getAllClients_srv, getClientByFrontendId_srv } = require("../service/printdesk");

const validateClient_ctrl = async (req, res) => {
  try {
    const { printdeskId } = req.params;

   const result=await validatingTheClientId(printdeskId);

    res.json(result);
  } catch (error) {
    console.error('Error validating client:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const addClient_ctrl = async (req, res) => {
  try {
    const { frontendId, printdeskId } = req.body;

    const result=await addClient_srv(frontendId,printdeskId);
    res.json(result);
  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteClientById_ctrl = async (req, res) => {
  try {
    const { id } = req.params;

   const result=await deleteClientById_srv(id);

    res.json(result);
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getClientById_ctrl = async (req, res) => {
  try {
    const { id } = req.params;

    const result=await getClientById_srv(id);

    res.json(result);
  } catch (error) {
    console.error('Error fetching client by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getClientByFrontendId_ctrl = async (req, res) => {
  try {
    const { frontendId } = req.params;

    const result = await getClientByFrontendId_srv(frontendId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching client by frontendId:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const getAllClients_ctrl = async (req, res) => {
  try {

    const result=await getAllClients_srv(); 
    res.json(result);
  } catch (error) {
    console.error('Error fetching all clients:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



module.exports = { validateClient_ctrl, addClient_ctrl,deleteClientById_ctrl,
  getClientById_ctrl,getAllClients_ctrl,getClientByFrontendId_ctrl };
