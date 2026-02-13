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

    // 1. Retrieve the peerId we attached in messageRouter
    const peerId = (socket as any).peerId;

    if (peerId) {
      // 2. We need to find which file/swarm this peer was in to notify others.
      // We can look this up in the store before removing.
      // (This assumes your PeerStore exposes a way to get fileId from peerId,
      // check PeerStore.ts implementation of peerMeta)

      // Accessing private map via a workaround or add a public method to PeerStore
      // Ideally, add `getFileId(peerId)` to PeerStore.
      // For now, let's assume we modify PeerStore to return the deleted info.

      const fileId = store.getFileId(peerId); // You need to add this method to PeerStore

      store.removePeer(peerId);

      if (fileId) {
        // 3. Notify remaining peers
        const peers = store.getPeers(fileId);
        peers.forEach((otherPeerId) => {
          const otherSocket = store.getSocket(otherPeerId);
          if (otherSocket && otherSocket.readyState === WebSocket.OPEN) {
            otherSocket.send(
              JSON.stringify({
                type: "PEER_LEFT",
                payload: { peerId },
              })
            );
          }
        });
      }
    }
  });
});

console.log("Tracker running on ws://localhost:8080");
