export type IncomingMessage =
  | JoinSwarmMessage
  | LeaveSwarmMessage
  | SignalMessage;

export interface JoinSwarmMessage {
  type: "JOIN_SWARM";
  payload: {
    peerId: string;
    fileId: string;
    bitfield: string;
  };
}

export interface LeaveSwarmMessage {
  type: "LEAVE_SWARM";
  payload: {
    peerId: string;
    fileId: string;
  };
}

export interface SignalMessage {
  type: "SIGNAL";
  payload: {
    targetPeerId: string;
    fromPeerId: string;
    signal: any;
  };
}
