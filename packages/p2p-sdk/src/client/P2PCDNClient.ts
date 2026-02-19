import { SwarmManager } from "../swarm/SwarmManager";
import { WebRTCManager } from "../webrtc/WebRTCManager";
import { PieceManager } from "../pieces/PieceManager";

export interface Manifest {
  fileId: string;
  totalChunks: number;
  chunkSize: number;
  trackerUrl: string;
}

type EventCallback = (data?: any) => void;

//client

export class P2PCDNClient {
  private peerId: string;

  private swarm: SwarmManager;
  private webrtc: WebRTCManager;
  private pieces: PieceManager;

  private listeners = new Map<string, EventCallback[]>();

  constructor(private manifest: Manifest) {
    this.peerId = crypto.randomUUID();

    console.log("Peer ID:", this.peerId);

    //initial subsystem

    this.swarm = new SwarmManager(manifest.trackerUrl, this.peerId);

    this.webrtc = new WebRTCManager(this.peerId, this.swarm);

    this.pieces = new PieceManager(
      manifest.totalChunks,
      this.createPeerMessagingInterface(),
      this.createStorageInterface()
    );
  }

  //public api

  start() {
    console.log("Starting P2P CDN Client");

    this.swarm.connect();

    // Join swarm after connection opens
    setTimeout(() => {
      this.swarm.join(this.manifest.fileId, this.pieces.getLocalBitfield());
    }, 300);

    this.emit("started");
  }

  stop() {
    this.swarm.leave(this.manifest.fileId);
    this.emit("stopped");
  }

  getPeerId() {
    return this.peerId;
  }

  getPeers() {
    return this.swarm.getPeers();
  }

  //event system

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  //internal writing

  //Bridge between PieceManager ↔ WebRTC DataChannels

  private createPeerMessagingInterface() {
    return {
      requestPiece: (peerId: string, chunkIndex: number) => {
        const dc = this.webrtc.getDataChannel(peerId);
        if (!dc) return;

        dc.send(
          JSON.stringify({
            type: "REQUEST",
            payload: { chunkIndex },
          })
        );
      },

      broadcastHave: (chunkIndex: number) => {
        this.webrtc.broadcast(
          JSON.stringify({
            type: "HAVE",
            payload: { chunkIndex },
          })
        );
      },
    };
  }

  // Storage abstraction (temporary memory store)
  //IndexedDB later

  private createStorageInterface() {
    const chunkStore = new Map<number, ArrayBuffer>();

    return {
      saveChunk: async (chunkIndex: number, data: ArrayBuffer) => {
        chunkStore.set(chunkIndex, data);
      },

      getChunk: async (chunkIndex: number) => {
        return chunkStore.get(chunkIndex);
      },
    };
  }
}
