type PeerId = string;

interface TrackerMessage {
  type: string;
  payload: any;
}

export class SwarmManager {
  private socket?: WebSocket;
  private peers = new Set<PeerId>();
  private messageQueue: string[] = [];
  constructor(private trackerUrl: string, private peerId: PeerId) {}

  connect() {
    this.socket = new WebSocket(this.trackerUrl);

    this.socket.onopen = () => {
      console.log("Connected to tracker");
      this.flushQueue();
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };

    this.socket.onclose = () => {
      console.log("Disconnected from tracker");
    };
  }

  join(fileId: string, bitfield = "") {
    this.send({
      type: "JOIN_SWARM",
      payload: {
        peerId: this.peerId,
        fileId,
        bitfield,
      },
    });
  }

  leave(fileId: string) {
    this.send({
      type: "LEAVE_SWARM",
      payload: {
        peerId: this.peerId,
        fileId,
      },
    });
  }

  sendSignal(targetPeerId: PeerId, signal: any) {
    this.send({
      type: "SIGNAL",
      payload: {
        targetPeerId,
        fromPeerId: this.peerId,
        signal,
      },
    });
  }

  getPeers(): PeerId[] {
    return Array.from(this.peers);
  }

  private listeners = new Map<string, Function[]>();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  private handleMessage(message: TrackerMessage) {
    switch (message.type) {
      case "SWARM_STATE":
        this.handleSwarmState(message.payload);
        break;

      case "PEER_JOINED":
        this.handlePeerJoined(message.payload);
        break;

      case "PEER_LEFT":
        this.handlePeerLeft(message.payload);
        break;

      case "SIGNAL":
        this.emit("signal", message.payload);
        break;
    }
  }

  private handleSwarmState(payload: any) {
    payload.peers.forEach((peerId: PeerId) => {
      this.peers.add(peerId);
    });

    this.emit("swarmState", this.getPeers());
  }

  private handlePeerJoined(payload: any) {
    const { peerId } = payload;

    this.peers.add(peerId);
    this.emit("peerJoined", peerId);
  }

  private handlePeerLeft(payload: any) {
    const { peerId } = payload;

    this.peers.delete(peerId);
    this.emit("peerLeft", peerId);
  }

  private send(message: TrackerMessage) {
    const payload = JSON.stringify(message);
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("Socket not ready,queuing message", message.type);
      this.messageQueue.push(payload);
      return;
    }

    this.socket.send(payload);
  }

  private flushQueue() {
    if (!this.socket) return;
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) this.socket.send(msg);
    }
  }
}
