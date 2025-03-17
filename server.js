// server.js
const express = require('express');
const app = express();
require('dotenv').config();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const cors = require('cors');

const morgan = require('morgan');
const { readdirSync } = require('fs');

const http = require("http");
const socketIo = require("socket.io");
const { validatingTheClientId } = require("./service/printdesk");


//middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());

// const validatingTheClientId = (printDeskId) => {
//   const registerdArr = [
//     { frontendId: "3jkfsjl", printdeskIds: "1111" },
//     { frontendId: "3jkfsj2", printdeskIds: "1111" },
//     { frontendId: "3jkfsj3", printdeskIds: "2222" }
//   ];

//   const matchedClients = registerdArr
//     .filter(item => item.printdeskIds === printDeskId)
//     .map(item => item.frontendId);

//   return matchedClients;
// };

// (async () => {
//   const printDeskId = "1111"; // Example printDeskId
//   const clients = await validatingTheClientId(printDeskId);
//   console.log(clients); // This will log the frontendIds for the matching printDeskId
// })();

// Create an HTTP server
// const server = http.createServer((req, res) => {
//   res.writeHead(200, { "Content-Type": "text/plain" });
//   res.end("Socket.IO Server\n");
// });

const server = http.createServer(app); // Use express with the same server for both

// Initialize Socket.IO
//const io = socketIo(server);

const corsOptions = {
  origin: "*", // Allow all origins (you can specify allowed domains if needed)
  methods: ["GET", "POST"],
  //allowedHeaders: ["Content-Type", "Authorization", "my-custom-header"],
  //credentials: true, // Allow credentials if needed
};

app.use(cors(corsOptions));

const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins (or specify domains like "https://yourfrontend.com")
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "my-custom-header"], // Add Content-Type for security
    credentials: true, // Allow credentials if using authentication
  },
  transports: ["websocket", "polling"],
});


// Store clients' information
let printdeskIds = [];
let frontendPrintDeskIds = [];
let frontendIds = [];
//{1234:"frontend",1212:"printApp"}
let pulseIntervals = {};

let printerList = []; //[{...printerList,printDeskId}]

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
      console.log(
        `Frontend Id ${frontendId} has joined with ID: ${
          socket.id
        }, frontendIds: ${JSON.stringify(frontendIds)}`
      );

      const frontendPrintdesk = frontendPrintDeskIds.find(
        (fd) => fd.frontendId === frontendId
      );

      if (frontendPrintdesk?.printDeskId) {
        io.to(socket.id).emit("printConnectionStatus", {
          sender: socket.id,
          status: "printdeskConnected",
        });
      } else {
        io.to(socket.id).emit("printConnectionStatus", {
          sender: socket.id,
          status: "printdeskNotAvailable",
        });
      }
      console.log("printerList:", printerList);
      //load printer list into the related frontend if the printer list exists
     // if (printerList.length===0) {
        
        const frontdesk = frontendIds.find(
          (f) => f.socketId === socket.id
        );

        const printdeskFrontdesk = frontendPrintDeskIds.find(
          (fp) => fp.frontendId === frontdesk.frontendId
        );
        console.log("printdeskFrontdesk:", printdeskFrontdesk);


        if (printdeskFrontdesk) {

          const printdesk = printdeskIds.find(
            (f) => f.printDeskId === printdeskFrontdesk.printDeskId
          );

          io.to(printdesk.socketId).emit("bringPrinterListFromPrintdesk", {
            sender: socket.id,
            status: "PrinterList Loaded"
          });
        }
    //  }
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on(
    "connectPrintDeskToTheService",
    async ({ printDeskId, message }) => {
      try {
        const result = await validatingTheClientId(printDeskId);
        console.log("validatingTheClientId", result);
        if (result.length === 0) {
          io.to(socket.id).emit("message", {
            sender: socket.id,
            message: "Printdesk id is not found.",
          });
          socket.disconnect(true); // Disconnects the client immediately
          return;
        }

        const index = printdeskIds.findIndex(
          (f) => f.printDeskId === printDeskId
        );
        if (index !== -1) {
          printdeskIds.splice(index, 1);
        }

        printdeskIds.push({ printDeskId, socketId: socket.id });
        console.log(
          `${printDeskId} has joined with ID: ${
            socket.id
          }, printdeskIds: ${JSON.stringify(printdeskIds)}`
        );

        result.forEach((frontendId) => {
          const index = frontendPrintDeskIds.findIndex(
            (f) => f.frontendId === frontendId
          );
          if (index !== -1) {
            frontendPrintDeskIds.splice(index, 1);
            console.log(`${frontendId} was removed.`);
          }
          frontendPrintDeskIds.push({ printDeskId, frontendId });
        });

        const frontendsByPrintdesk = frontendPrintDeskIds.filter(
          (fd) => fd.printDeskId === printDeskId
        );

        frontendsByPrintdesk.forEach((element) => {
          const frontendSocket = frontendIds.find(
            (f) => f.frontendId === element.frontendId
          );
          if (frontendSocket) {
            io.to(frontendSocket.socketId).emit("printConnectionStatus", {
              sender: socket.id,
              status: "printdeskConnected",
            });
          }
        });

        // Start sending pulse messages
        if (pulseIntervals[socket.id]) {
          clearInterval(pulseIntervals[socket.id]);
        }
        pulseIntervals[socket.id] = setInterval(() => {
          const frontends = frontendsByPrintdesk.map((fd) =>
            frontendIds.find((f) => f.frontendId === fd.frontendId)
          );
          frontends.forEach((frontendSocket) => {
            if (frontendSocket) {
              io.to(frontendSocket.socketId).emit("pulse", {
                sender: socket.id,
                status: "printdeskAvailable",
              });
            }
          });
        }, 5000);

        io.to(socket.id).emit("connectPrintDeskToTheServiceAck", {
          sender: socket.id,
          message: "Connected Successfully...",
        });
      } catch (error) {
        handleSocketError(socket, error);
      }
    }
  );

  socket.on("sendPrint", ({ printDeskId, printerName,receiptSize, receiptData }) => {
    try {
      console.log('recipient printDeskId',printDeskId);
      const recipient = printdeskIds.find((p) => p.printDeskId === printDeskId);
      if (recipient) {
        io.to(recipient.socketId).emit("print", {
          sender: socket.id,
          printerName,
          receiptSize,
          receiptData,
        });
        io.to(socket.id).emit("printRespond", {
          sender: socket.id,
          message: "Print sent",
        });
      } else {
        const message = `No matching printDeskId found for ${printDeskId}`;
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

  socket.on("printList", (data) => {
    // Handle the received printer list
    console.log("printdeskids:", printdeskIds);
    console.log("Receive from socket:", socket.id);
    const printers = data.printers;
    console.log("Received data:", data);

    const printdesk = printdeskIds.find((fd) => fd.socketId === socket.id);
    if (printdesk) {
      console.log("printdesk:", printdesk);
      const frontendPrintDesk = frontendPrintDeskIds.find(
        (f) => f.printDeskId === printdesk.printDeskId
      );
      const frontendSocket = frontendIds.find(
        (f) => f.frontendId === frontendPrintDesk.frontendId
      );

      const index = printerList.findIndex(
        (f) => f.frontendId === frontendPrintDesk.frontendId
      );
      if (index !== -1) {
        printerList.splice(index, 1);
      }

      printerList.push({ printers, frontendId: frontendPrintDesk.frontendId });

      if (frontendSocket) {
        io.to(frontendSocket.socketId).emit("loadPrinterListToFrontend", {
          sender: socket.id,
          status: "PrinterList Loaded",
          printerList: printers,
        });
      }
    }

    // Respond back to the client if needed
    socket.emit("message", {
      sender: "Server",
      message: "Printer list received successfully.",
    });
  });

  socket.on("privateMessage", ({ recipientId, message }) => {
    try {
      io.to(recipientId).emit("message", { sender: socket.id, message });
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on("disconnect", (reason) => {
    try {
      console.log(`Socket ${socket.id} disconnected: ${reason}`);
      clearInterval(pulseIntervals[socket.id]);
      delete pulseIntervals[socket.id];

      const printdesk = printdeskIds.find((fd) => fd.socketId === socket.id);
      if (printdesk) {
        const frontendPrintDesk = frontendPrintDeskIds.find(
          (f) => f.printDeskId === printdesk.printDeskId
        );
        const frontendSocket = frontendIds.find(
          (f) => f.frontendId === frontendPrintDesk.frontendId
        );

        if (frontendSocket) {
          io.to(frontendSocket.socketId).emit("printConnectionStatus", {
            sender: socket.id,
            status: "printdeskNotAvailable",
          });
        }
      }

      const index = printdeskIds.findIndex((f) => f.socketId === socket.id);
      if (index !== -1) {
        printdeskIds.splice(index, 1);
        console.log(`${printdeskIds} was removed from printdeskIds.`);
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



const routeArr = readdirSync('./routes');
routeArr.map((r) => {
  //import routes
   const route = require('./routes/' + r);
  //routes middlewares
   app.use('/', route);
});




// // Graceful Shutdown
// process.on("SIGINT", () => {
//   console.log("Server shutting down...");

//   // Notify all connected clients
//   io.emit("serverShutdown", { message: "The server is shutting down." });

//   // Close the HTTP server and exit
//   server.close(() => {
//     console.log("HTTP server closed.");
//     process.exit(0);
//   });
// });

// Start the server on port 5112
// server.listen(5112, () => {
//   console.log("Server is running on http://localhost:5112");
// });

// Start the server on port 5112 with express
server.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
