import SimplePeer from 'simple-peer';

/**
 * RTCPeerConnection configuration 
 */

 const configuration = {
    // Using From https://www.metered.ca/tools/openrelay/
    "iceServers": [
    {
      urls: "stun:openrelay.metered.ca:80"
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
}

var peers;
var socket;
// Initialize audio stream for socket
export function initializeAudio(_socket, _peers) {
    peers = _peers;
    socket = _socket;
    socket.on('initReceive', socket_id => {
        console.log('INIT RECEIVE ' + socket_id);
        addPeer(socket_id, false)

        socket.emit('initSend', socket_id)
    })

    socket.on('initSend', socket_id => {
        console.log('INIT SEND ' + socket_id)
        addPeer(socket_id, true)
    })

    socket.on('removePeer', socket_id => {
        console.log('removing peer ' + socket_id)
        removePeer(socket_id)
    })

    socket.on('signal', data => {
        peers[data.socket_id].signal(data.signal)
    })
}

function addPeer(socket_id, am_initiator, localStream) {

    navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(stream => {
        let localStream = stream; 
        console.log('EOO'  + localStream);
        peers[socket_id] = new SimplePeer({
            initiator: am_initiator,
            stream: localStream,
            config: configuration
        });
        peers[socket_id].on('signal', data => {
            socket.emit('signal', {
                signal: data,
                socket_id: socket_id
            })
        })
    
        peers[socket_id].on('stream', stream => {
            console.log('Was here');
            let newVid = document.createElement('video')
            newVid.srcObject = stream
            newVid.id = socket_id
            newVid.playsinline = false
            newVid.autoplay = true
            newVid.className = "vid"
            // append newVid to body
            document.body.appendChild(newVid)
        });
        /**
         * Enable/disable microphone
         */
        function toggleMute() {
            console.log("Microphone has been toggled");
            for (let index in localStream.getAudioTracks()) {
                localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
                muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
            }
        }
        
        window.toggleMute = toggleMute;


        
    });
    

}

export function removePeer(socket_id) {

    let videoEl = document.getElementById(socket_id)
    if (videoEl) {

        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        videoEl.srcObject = null
        videoEl.parentNode.removeChild(videoEl)
    }
    if (peers[socket_id]) peers[socket_id].destroy()
    delete peers[socket_id]
}