import WebSocket from "ws";

export class PeerStore {
  private swarmRegistry = new Map<string, Set<string>>(); //fileId,peerId
  private peerSockets = new Map<string, WebSocket>(); //peerId, Socket
  private socketToPeer = new Map<WebSocket, string>();
  private peerMeta = new Map<string, { fileId: string }>(); //peerId,fileId

  addPeer(peerId: string, fileId: string, socket: WebSocket) {
    this.peerSockets.set(peerId, socket);
    this.socketToPeer.set(socket, peerId);
    this.peerMeta.set(peerId, { fileId });

    if (!this.swarmRegistry.has(fileId)) {
      this.swarmRegistry.set(fileId, new Set());
    }
    this.swarmRegistry.get(fileId)!.add(peerId);
  }

  removePeer(peerId: string) {
    const meta = this.peerMeta.get(peerId);
    if (!meta) {
      console.error(`Peer ${peerId} not found in peer store`);
      return;
    }
    const socket = this.peerSockets.get(peerId);

    if (socket) {
      this.socketToPeer.delete(socket); // ✅ CLEANUP
    }
    const { fileId } = meta;
    this.swarmRegistry.get(fileId)?.delete(peerId);
    this.peerSockets.delete(peerId);
    this.peerMeta.delete(peerId);
  }

  removePeerBySocket(socket: WebSocket): string | null {
    const peerId = this.socketToPeer.get(socket);
    if (!peerId) return null;

    this.removePeer(peerId);

    return peerId;
  }

  getPeers(fileId: string): string[] {
    return Array.from(this.swarmRegistry.get(fileId) || []);
  }

  getSocket(peerId: string): WebSocket | undefined {
    return this.peerSockets.get(peerId);
  }

  getFileId(peerId: string): string | undefined {
    return this.peerMeta.get(peerId)?.fileId;
  }

  getPeerMeta(peerId: string) {
    return this.peerMeta.get(peerId);
  }
}
