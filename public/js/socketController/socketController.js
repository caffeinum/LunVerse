import { initializeAudio, removePeer } from '../socketController/audioSocket';
import { initializePlayersSocket } from '../socketController/playerSocket';
import { io } from "socket.io-client";

/**
 * Initialize socket and connect to server by socket.io
 */
 export function initializeSocket(self, peers) {
    self.socket = io('ws://localhost:5000');

    // Initialize audio stream for socket
    initializeAudio(self.socket, peers);

    // Initialize player socket
    initializePlayersSocket(self, peers);
}