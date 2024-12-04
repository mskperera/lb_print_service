// server.js
const http = require("http");
const socketIo = require("socket.io");

const validatingTheClientId = (printDeskId) => {
  const registerdArr = [
    { frontendId: "3jkfsjl", printdeskIds: "1111" },
    { frontendId: "3jkfsj2", printdeskIds: "1111" },
    { frontendId: "3jkfsj3", printdeskIds: "2222" }
  ];

  const matchedClients = registerdArr
    .filter(item => item.printdeskIds === printDeskId)
    .map(item => item.frontendId);

  return matchedClients;
};



// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO Server\n");
});

// Initialize Socket.IO
//const io = socketIo(server);
// Enable CORS for the server
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

// Store clients' information
let printdeskIds = [];
let frontendPrintDeskIds = [];
let frontendIds = [];
//{1234:"frontend",1212:"printApp"}


const handleSocketError = (socket, error) => {
  console.error(`Error on socket ${socket.id}:`, error.message || error);
  socket.emit("error", { message: "An unexpected error occurred" });
};

io.on("connection", (socket) => {
  console.log("A user connectedooo", socket.id);

  socket.on("connectFrontendToTheService", ({ frontendId }) => {
    try {
      console.log(" connectFrontendToTheService");
      const index = frontendIds.findIndex((f) => f.frontendId === frontendId);
      if (index !== -1) {
        frontendIds.splice(index, 1);
      }

      frontendIds.push({ frontendId, socketId: socket.id });
      console.log(`Frontend Id ${frontendId} has joined with ID: ${socket.id}, frontendIds: ${JSON.stringify(frontendIds)}`);


      const frontendPrintdesk = frontendPrintDeskIds.find(fd => fd.frontendId === frontendId);

      if(frontendPrintdesk?.printDeskId){
        io.to(socket.id).emit("printConnectionStatus", {
          sender: socket.id,
          status: "printdeskConnected",
        });
      }
      else{
        io.to(socket.id).emit("printConnectionStatus", {
          sender: socket.id,
          status: "connected",
        });
      }
    

 

    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on("connectPrintDeskToTheService", ({ printDeskId, message }) => {
    try {
      console.log("printDeskId", printDeskId);
      const result = validatingTheClientId(printDeskId);
      console.log("validatingTheClientId", result);

      if (result.length === 0) {
        io.to(socket.id).emit("message", {
          sender: socket.id,
          message: "Printdesk id is not found.",
        });
        socket.disconnect(true); // Disconnects the client immediately
        return;
      }

      const index = printdeskIds.findIndex((f) => f.printDeskId === printDeskId);
      if (index !== -1) {
        printdeskIds.splice(index, 1);
      }

      printdeskIds.push({ printDeskId, socketId: socket.id });
      console.log(`${printDeskId} has joined with ID: ${socket.id}, printdeskIds: ${JSON.stringify(printdeskIds)}`);

      result.forEach((frontendId) => {
        console.log(`element: ${JSON.stringify(frontendId)}`);
        const index = frontendPrintDeskIds.findIndex((f) => f.frontendId === frontendId);
        if (index !== -1) {
          frontendPrintDeskIds.splice(index, 1);
          console.log(`${frontendId} was removed.`);
        }

        frontendPrintDeskIds.push({ printDeskId, frontendId });
      
        const frontendPrintdesk = frontendPrintDeskIds.find(fd => fd.printDeskId === printDeskId);

        if(frontendPrintdesk?.frontendId){

const frontendSocket=frontendIds.find(f=>f.frontendId===frontendId);
console.log(`frontendSocket: ${frontendSocket.socketId}`);


          io.to(frontendSocket.socketId).emit("printConnectionStatus", {
            sender: socket.id,
            status: "printdeskConnected",
          });
        }
     




      });

      console.log(`frontendPrintDeskIds: ${JSON.stringify(frontendPrintDeskIds)}`);

      io.to(socket.id).emit("message", {
        sender: socket.id,
        message: "Connected Successfully...",
      });
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on("sendPrint", ({ printDeskId, printer, payload }) => {
    try {
      const recipient = printdeskIds.find((p) => p.printDeskId === printDeskId);
      if (recipient) {
        console.log(`Socket ID for printDeskId ${printDeskId} is: ${recipient.socketId}`);
        io.to(recipient.socketId).emit("print", { sender: socket.id, printer, payload });
        io.to(socket.id).emit("printRespond", {
          sender: socket.id,
          message: "Print sent",
        });
      } else {

        const message=`No matching printDeskId found for ${printDeskId}`;
        io.to(socket.id).emit("printRespond", {
          sender: socket.id,
          message: message,
        });
        console.log(message);
      }
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on("privateMessage", ({ recipientId, message }) => {
    try {
      console.log(`Private message to ${recipientId}: ${message}`);
      io.to(recipientId).emit("message", { sender: socket.id, message });
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on("disconnect", (reason) => {
    try {
      console.log(`Socket ${socket.id} disconnected:`, reason);

      const index = printdeskIds.findIndex((f) => f.socketId === socket.id);
      if (index !== -1) {
        printdeskIds.splice(index, 1);
      }



      const printdesk = printdeskIds.find(fd => fd.socketId === socket.id);

      if(printdesk){

const frontendPrintDesk=frontendPrintDeskIds.find(f=>f.printDeskId===printdesk.printDeskId);

const frontendSocket=frontendIds.find(f=>f.frontendId===frontendPrintDesk.frontendId);
console.log(`frontendSocket:`, frontendSocket);

if(frontendSocket){

  io.to(frontendSocket.socketId).emit("printConnectionStatus", {
    sender: socket.id,
    status: "printdeskDisconnected",
  });

}
     
      }



    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on("error", (error) => {
    console.error(`Error on socket ${socket.id}:`, error.message || error);
  });
});

// Global Error Handling for the Server
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

server.on("error", (error) => {
  console.error("Server Error:", error.message || error);
});

// Graceful Shutdown
// process.on("SIGINT", () => {
//   console.log("Server shutting down...");
//   server.close(() => {
//     console.log("HTTP server closed.");
//     process.exit(0);
//   });
// });

// Start the server on port 5112
server.listen(5112, () => {
  console.log("Server is running on http://localhost:5112");
});
