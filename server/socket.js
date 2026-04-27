// Socket.io server setup
import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*', // You can restrict this in production
      methods: ["GET", "POST"]
    }
  });
  io.on("connection", (socket) => {
    // You can add authentication here if needed
    // console.log("Socket connected", socket.id);
  });
  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}
