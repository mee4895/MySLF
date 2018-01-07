var Peer = require('simple-peer');
var mqtt = require('mqtt');

document.getElementById('create').addEventListener('click', function() {
	let lobbyId = createLobby();
	document.getElementById('lobbycode').textContent = 'Lobby: ' + lobbyId;
	document.getElementById('create').disabled = true;
	document.getElementById('lobbyid').disabled = true;
	document.getElementById('join').disabled = true;
});

document.getElementById('join').addEventListener('click', function() {
	joinLobby(document.getElementById('lobbyid').value);
	document.getElementById('create').disabled = true;
	document.getElementById('lobbyid').disabled = true;
	document.getElementById('join').disabled = true;
});

var client = mqtt.connect('ws://test.mosquitto.org:8080');
client.on('connect', function () {
	console.log('connected to mqtt');
});

dssSend = function(dssChannel, dssMsg, callback) {
	client.publish(dssChannel, JSON.stringify(dssMsg));
	callback();
};
dssRecieve = function(dssChannel, msgCallback) {
	client.on('message', function (topic, message) {
		msgCallback(JSON.parse(message));
	});
	client.subscribe(dssChannel);
};

var peers = [];
addPeer = function(dssChannel, trackingId, userId) {
	var peer = {
		userId: userId,
		trackingId: trackingId,
		online: false,
		connection: new Peer({
			initiator: true,
			trickle: false
		})
	};

	peer.connection.on('signal', function(data) {
		dssSend(dssChannel, {
			type: 'peer',
			trackingId: trackingId,
			initiator: true,
			data: data
		}, function(err, dssMsg) {
			console.log('awaiting peer');
		});
	});
	peer.connection.on('connect', function() {
		peer.trackingId = undefined;
		peer.online = true;
		peer.connection.send('Hi from Server');
	});
	peer.connection.on('data', function(data) {
		console.log(data);
	});

	peers.push(peer);
};

createLobby = function() {
	let lobbyId = Math.random().toString(36).substring(3, 8);
	let dssChannel = 'myslf/' + lobbyId;
	dssRecieve(dssChannel, function(dssMsg) {
		if (dssMsg.type === 'welcome') {
			if (!peers.find(peer => peer.trackingId === dssMsg.trackingId)) {
				dssSend(dssChannel, {
					type: 'confirm',
					trackingId: dssMsg.trackingId
				}, function(err, dssMsg) {
					console.log(err);
					console.log(dssMsg);
				});
				addPeer(dssChannel, dssMsg.trackingId, dssMsg.userId);
			}
		} else if (dssMsg.type === 'peer') {
			if (!dssMsg.initiator) {
				peers.find(peer => peer.trackingId === dssMsg.trackingId).connection.signal(dssMsg.data);
				console.log(dssMsg.data);
			}
		}
	});
	return lobbyId;
};

var host;
joinLobby = function(lobbyId) {
	let dssChannel = 'myslf/' + lobbyId;
	let trackingId =  Math.random().toString(36).substring(3, 8);
	var waitForKey = false;
	dssRecieve(dssChannel, function(dssMsg) {
		if (dssMsg.trackingId == trackingId) {
			if ((!waitForKey) && dssMsg.type === 'confirm') {
				waitForKey = true;
				host = new Peer({
					initiator: false,
					trickle: false
				});

				host.on('signal', function(data) {
					dssSend(dssChannel, {
						type: 'peer',
						trackingId: trackingId,
						initiator: false,
						data: data
					}, function(err, dssMsg) {
						console.log('awaiting peer');
					});
				});
				host.on('connect', function() {
					host.connection.send('Hi from Client');
				});
				host.on('data', function(data) {
					console.log(data);
				});
			} else if (waitForKey && dssMsg.type === 'peer') {
				host.signal(dssMsg.data);
			}
		}
	});
	dssSend(dssChannel, {
		type: 'welcome',
		trackingId: trackingId,
		userId: 'Klaus'
	}, function(err, dssMsg) {
		console.log('contacting server');
	});
};
