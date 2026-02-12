import { SwarmManager } from "../swarm/SwarmManager";

const peerId = crypto.randomUUID();

const swarm = new SwarmManager("ws://localhost:8080", peerId);

swarm.connect();

swarm.join("video-abc");

swarm.on("peerJoined", (peerId: any) => {
  console.log("New peer:", peerId);
});

swarm.on("peerLeft", (peerId: any) => {
  console.log("Peer left:", peerId);
});
