import { SwarmManager } from "../swarm/SwarmManager";
import { WebRTCManager } from "../webrtc/WebRTCManager";

const peerId = crypto.randomUUID();

const swarm = new SwarmManager("ws://localhost:8080", peerId);
const webrtc = new WebRTCManager(peerId, swarm);

swarm.connect();
swarm.join("video-abc");

swarm.on("peerJoined", (peerId: any) => {
  console.log("New peer:", peerId);
});

swarm.on("peerLeft", (peerId: any) => {
  console.log("Peer left:", peerId);
});
