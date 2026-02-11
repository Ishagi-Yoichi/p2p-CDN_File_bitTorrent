import WebSocket, { WebSocketServer } from "ws";
import { PeerStore } from "./swarm/peerStore";
import { handleMessage } from "./ws/messageRouter";

const wss = new WebSocketServer({ port: 8080 });
const store = new PeerStore();

wss.on("connection", (socket: WebSocket) => {
  console.log("Peer connected");

  socket.on("message", (data) => {
    handleMessage(store, socket, data);
  });

  socket.on("close", () => {
    console.log("Peer disconnected");

    // IMPORTANT:
    // We must detect which peer disconnected
    // (Handled later when we attach peerId → socket mapping)
  });
});

console.log("Tracker running on ws://localhost:8080");
