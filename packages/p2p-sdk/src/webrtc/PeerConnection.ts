export class PeerConnection {
  public pc: RTCPeerConnection;
  public dc?: RTCDataChannel;

  constructor(
    private peerId: string,
    private sendSignal: (signal: any) => void
  ) {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    /* ---------------- ICE Handling ---------------- */

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate →", this.peerId);

        this.sendSignal({
          candidate: event.candidate,
        });
      }
    };

    /* ---------------- Connection Debugging ---------------- */

    this.pc.onconnectionstatechange = () => {
      console.log(
        `Connection state (${this.peerId}):`,
        this.pc.connectionState
      );
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log(`ICE state (${this.peerId}):`, this.pc.iceConnectionState);
    };

    /* ---------------- DataChannel (Receiver Side) ---------------- */

    this.pc.ondatachannel = (event) => {
      console.log("DC received:", this.peerId);

      this.dc = event.channel;

      this.attachDataChannelHandlers();
    };
  }

  /* ---------------- Offerer Creates DataChannel ---------------- */

  createDataChannel() {
    console.log("Creating DC:", this.peerId);

    this.dc = this.pc.createDataChannel("data-channel", {
      ordered: true,
    });

    this.attachDataChannelHandlers();
  }

  /* ---------------- Shared DC Handlers ---------------- */

  private attachDataChannelHandlers() {
    if (!this.dc) return;

    this.dc.onopen = () => {
      console.log("✅ DC OPEN:", this.peerId);
    };

    this.dc.onclose = () => {
      console.log("❌ DC CLOSED:", this.peerId);
    };

    this.dc.onerror = (err) => {
      console.error("DC ERROR:", this.peerId, err);
    };

    this.dc.onmessage = (event) => {
      console.log("DC MESSAGE:", this.peerId, event.data);

      // Later → forward to PieceManager
    };
  }
}
