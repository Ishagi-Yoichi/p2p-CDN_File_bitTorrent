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
    console.log("Socket closed");

    const peerId = store.removePeerBySocket(socket);

    if (!peerId) return;

    const meta = store.getPeerMeta(peerId);
    if (!meta) return;

    const peers = store.getPeers(meta.fileId);

    peers.forEach((otherPeerId) => {
      const peerSocket = store.getSocket(otherPeerId);

      peerSocket?.send(
        JSON.stringify({
          type: "PEER_LEFT",
          payload: { peerId },
        })
      );
    });

    console.log("Cleaned peer:", peerId);
  });
});

console.log("Tracker running on ws://localhost:8080");
