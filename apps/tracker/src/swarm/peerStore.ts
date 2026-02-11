import websocket from "ws";

export class PeerStore {
    private swarmRegistry = new Map<string, Set<String>>();
    private peerSockets = new Map<string, WebSocket>();
    private peerMeta = new Map<string, { fileId: string }>();

    addPeer(peerId: string, fileId: string,socket:WebSocket) {
        this.peerSockets.set(peerId,socket);
        this.peerMeta.set(peerId, { fileId });

        if (!this.swarmRegistry.has(fileId)) {
            this.swarmRegistry.set(fileId, new Set());
        }
        this.swarmRegistry.get(fileId)!.add(peerId);
    }

    removePeer(peerId: string, fileId: string) {

         const meta = this.peerMeta.get(peerId);
         if (!meta) {
            console.error(`Peer ${peerId} not found in peer store`);
            return;
         }
         const { fileId } = meta;
        this.swarmRegistry.get(fileId)?.delete(peerId);
        this.peerSockets.delete(peerId);
        this.peerMeta.delete(peerId);
    }

     getPeers(fileId: string): string[] {
    return Array.from(this.swarmRegistry.get(fileId) || []);
  }

  getSocket(peerId: string): WebSocket | undefined {
    return this.peerSockets.get(peerId);
  }
}