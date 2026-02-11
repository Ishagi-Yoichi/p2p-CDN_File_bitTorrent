import { PeerStore } from "../swarm/peerStore";

export function relaySignal(store: PeerStore, payload: any) {
  const targetSocket = store.getSocket(payload.targetPeerId);

  if (!targetSocket) return;

  targetSocket.send(
    JSON.stringify({
      type: "SIGNAL",
      payload: {
        fromPeerId: payload.fromPeerId,
        signal: payload.signal,
      },
    })
  );
}
