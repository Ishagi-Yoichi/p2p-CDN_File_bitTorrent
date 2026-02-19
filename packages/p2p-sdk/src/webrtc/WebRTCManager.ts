import { PeerConnection } from "./PeerConnection";

export class WebRTCManager {
  private connections = new Map<string, PeerConnection>();

  constructor(
    private peerId: string,
    private swarm: any // SwarmManager injected
  ) {
    swarm.on("peerJoined", (peerId: string) => {
      this.handlePeerDiscovered(peerId);
    });

    swarm.on("signal", (data: any) => {
      this.handleSignal(data);
    });
  }

  // PEER DISCOVERY

  private handlePeerDiscovered(remotePeerId: string) {
    if (this.connections.has(remotePeerId)) return;

    const connection = this.createConnection(remotePeerId);

    const shouldCreateOffer = this.peerId < remotePeerId;

    if (shouldCreateOffer) {
      this.createOffer(connection, remotePeerId);
    }
  }

  private createConnection(remotePeerId: string) {
    const connection = new PeerConnection(remotePeerId, (signal) => {
      this.swarm.sendSignal(remotePeerId, signal);
    });

    this.connections.set(remotePeerId, connection);

    return connection;
  }

  //OFFER / ANSWER

  private async createOffer(connection: PeerConnection, remotePeerId: string) {
    connection.createDataChannel();

    const offer = await connection.pc.createOffer();
    await connection.pc.setLocalDescription(offer);

    this.swarm.sendSignal(remotePeerId, { sdp: offer });
  }

  private async handleSignal(data: any) {
    const { fromPeerId, signal } = data;

    let connection = this.connections.get(fromPeerId);

    if (!connection) {
      connection = this.createConnection(fromPeerId);
    }

    if (signal.sdp) {
      await this.handleSDP(connection, fromPeerId, signal.sdp);
    }

    if (signal.candidate) {
      await connection.pc.addIceCandidate(signal.candidate);
    }
  }

  private async handleSDP(
    connection: PeerConnection,
    remotePeerId: string,
    sdp: RTCSessionDescriptionInit
  ) {
    if (sdp.type === "offer") {
      await connection.pc.setRemoteDescription(sdp);

      const answer = await connection.pc.createAnswer();
      await connection.pc.setLocalDescription(answer);

      this.swarm.sendSignal(remotePeerId, { sdp: answer });
    }

    if (sdp.type === "answer") {
      await connection.pc.setRemoteDescription(sdp);
    }
  }

  getDataChannel(peerId: string) {
    return this.connections.get(peerId)?.dc;
  }

  broadcast(message: string) {
    this.connections.forEach((conn) => {
      conn.dc?.send(message);
    });
  }
}
