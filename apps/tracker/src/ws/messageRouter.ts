import WebSocket from "ws";
import { PeerStore } from "../swarm/peerStore";
import { IncomingMessage } from "../types/messages";
import { relaySignal } from "../signaling/relay";

export function handleMessage(
  store: PeerStore,
  socket: WebSocket,
  rawMessage: WebSocket.RawData
) {
  const message: IncomingMessage = JSON.parse(rawMessage.toString());

  switch (message.type) {
    case "JOIN_SWARM":
      handleJoin(store, socket, message.payload);
      break;

    case "LEAVE_SWARM":
      store.removePeer(message.payload.peerId);
      break;

    case "SIGNAL":
      relaySignal(store, message.payload);
      break;
  }
}

function handleJoin(store: PeerStore, socket: WebSocket, payload: any) {
  const { peerId, fileId } = payload;

  store.addPeer(peerId, fileId, socket);

  // Send swarm state
  const peers = store
    .getPeers(fileId)
    .filter((id) => id !== peerId);

  socket.send(
    JSON.stringify({
      type: "SWARM_STATE",
      payload: { peers },
    })
  );

  // Notify others
  peers.forEach((otherPeerId) => {
    const peerSocket = store.getSocket(otherPeerId);

    peerSocket?.send(
      JSON.stringify({
        type: "PEER_JOINED",
        payload: { peerId },
      })
    );
  });
}
