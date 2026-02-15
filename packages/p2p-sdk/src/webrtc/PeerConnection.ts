export class PeerConnection {
  public pc: RTCPeerConnection;
  public dc?: RTCDataChannel;

  constructor(
    private peerId: string,
    private sendSignal: (signal: any) => void,
  ) {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({ candidate: event.candidate });
      }
    };
  }

  createDataChannel() {
    this.dc = this.pc.createDataChannel("data");

    this.dc.onopen = () => console.log("DC open:", this.peerId);
    this.dc.onclose = () => console.log("DC closed:", this.peerId);
  }
}
