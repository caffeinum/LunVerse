import Phaser from 'phaser';
import { initializeSocket } from '../socketController/socketController';
import { initMainMap, updatePlayerPosition, initKeysForController } from '../utils/utils';
import { createAnimationForPlayer } from "../anims/characterAnims";
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';
import { sceneEvents } from '../Events/EventsCenter';


/**
 * All peer connections
 */
let peers = {};

// Speed of all players
const spriteSpeed = 2;

var drawBattle, cancelButton;

// BACKGROUND
var shadowGroup;

export class MainScene extends Phaser.Scene {

    constructor(stream) {
        super({ key: 'MainScene' });
    }

    init(data) {
        if (data.stream != false) {
            this.localStream = data.stream;
            let localStream = this.localStream;
            for (let index in localStream.getAudioTracks()) {
                const localStreamEnabled = localStream.getAudioTracks()[index].enabled;
                localStream.getAudioTracks()[index].enabled = !localStreamEnabled;
            }
        }
    }

    preload() {
        initKeysForController(this);
        this.load.plugin('rexvirtualjoystickplugin', VirtualJoystickPlugin);
    }
    create() {

        this.playerUI = {};
        // Create Animations for heroes
        for (let i = 0; i < 4; i++) {
            createAnimationForPlayer(this.anims, i);
        }

        // Add Game Ui
        this.scene.run('game-ui');


        initMainMap(this);




        // Set camera zoom to 3
        this.cameras.main.setZoom(1.5);
        //this.cameras.main.setBounds(0, 0, 1000, 1000);

        initializeSocket(this, peers);

        this.playerName = this.add.text(0, 0, 'sad.eth', { fontFamily: 'monospace', fill: '#CCFFFF' })

        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) {
            this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
                x: 400,
                y: 470,
                radius: 50,
                base: this.add.circle(0, 0, 50, 0x888888),
                thumb: this.add.circle(0, 0, 25, 0xcccccc),
                // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
                // forceMin: 16,
                // enable: true
            });
            this.cursorKeys = this.joyStick.createCursorKeys();
        }

        sceneEvents.on('toggleMute', () => {
            if (this.localStream) {
                this.toggleMute();
                bullShit.destroy();
            };
        });

        const self = this;
        function addDomElement() {
            const iframe = document.createElement('iframe');
            iframe.src = "https://drawbattle.io";
            iframe.style.width = "600px";
            iframe.style.height = "370px";
            drawBattle = self.add.dom(310, 670, iframe);
            cancelButton = self.add.image(535, 440, 'x-button').setScale(0.3).setInteractive().on('pointerdown', () => {
                drawBattle.destroy();
                drawBattle = null;
                cancelButton.destroy();
            });
        }

        shadowGroup = this.add.group();

        var keyIframe = this.input.keyboard.addKey('X');  // Get key object
        keyIframe.on('down', function (event) {
            if (!drawBattle) addDomElement();
            else {
                drawBattle.destroy();
                drawBattle = null;
                this.xButton.alpha = 0;
            }
        });



    }

    checkOverlap(a, b) {
        var boundsA = a.getBounds();
        var boundsB = b.getBounds();

        return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
    }

    addShadow() {
        let x = 200;
        let y = 650;
        let w = 130;
        let h = 60;
        shadowGroup.add(this.add.rectangle(0, y + 500, 2000, 950, 0x000000).setAlpha(0.4));
        shadowGroup.add(this.add.rectangle(0, y - 145, 2000, 200, 0x000000).setAlpha(0.4));
        shadowGroup.add(this.add.rectangle(0, y - 10, 270, h + 10, 0x000000).setAlpha(0.4));
        shadowGroup.add(this.add.rectangle(x + w + 175, y - 10, 500, h + 10, 0x000000).setAlpha(0.4));
        shadowGroup.add(this.add.image(180, 650, 'play-button').setScale(0.1).setAlpha());
        shadowGroup.add(this.add.text(150, 700, 'PRESS X', { fill: "#ffffff" }));

    }

    update(time, delta) {
        if (this.player) {
            this.animatedTiles.forEach(tile => tile.update(delta));
            //console.log(this.player.x, this.player.y);
            if (this.checkOverlap(this.player, this.rectangleTrigger)) {
                if (!this.trigger) {
                    this.addShadow();
                }
                this.trigger = true;
            }
            else {
                this.trigger = false;
                shadowGroup.clear(true);
            }
            //console.log(this.player.x, this.player.y);
            // write text size of clibButton
            //console.log
            const playerUI = this.playerUI[this.socket.id];
            const playerText = playerUI.playerText;
            const textSize = playerText.text.length;
            playerText.x = this.player.x - textSize * 3.5;
            playerText.y = this.player.y - 27;

            playerUI.microphone.x = this.player.x;
            playerUI.microphone.y = this.player.y - 32;

            // update player position
            if (!drawBattle) {
                updatePlayerPosition(this);

                emitPlayerPosition(this);
            }
        }
        if (this.otherPlayers) {
            this.otherPlayers.getChildren().forEach(otherPlayer => {
                const playerUI = this.playerUI[otherPlayer.playerId];
                const otherPlayerText = playerUI.playerText;
                otherPlayerText.x = otherPlayer.x - otherPlayerText.text.length * 3.5;
                otherPlayerText.y = otherPlayer.y - 25;
                playerUI.microphone.x = otherPlayer.x;
                playerUI.microphone.y = otherPlayer.y - 32;
            });
        }
    }

    toggleMute() {
        let localStream = this.localStream;
        for (let index in localStream.getAudioTracks()) {
            let localStreamEnabled = localStream.getAudioTracks()[index].enabled;
            localStream.getAudioTracks()[index].enabled = !localStreamEnabled;

            localStreamEnabled = !localStreamEnabled;

            this.playerUI[this.socket.id].microphone.setTexture(localStreamEnabled ? 'microphone' : 'microphoneMuted');

            this.socket.emit("updatePlayerInfo", { microphoneStatus: localStreamEnabled }, this.socket.id);
            sceneEvents.emit("microphone-toggled", localStreamEnabled);
        }
    }
}



/**
 * Send player position to server
 * @param {this.player} player 
 */
function emitPlayerPosition(self) {
    var player = self.player;
    var socket = self.socket;
    // emit player movement
    var x = player.x;
    var y = player.y;
    var r = player.rotation;
    if (player.oldPosition && (x !== player.oldPosition.x || y !== player.oldPosition.y || r !== player.oldPosition.rotation)) {
        socket.emit('playerMovement', { x: player.x, y: player.y, rotation: player.rotation });
    }
    // save old position data
    player.oldPosition = {
        x: player.x,
        y: player.y,
        rotation: player.rotation
    };
}


