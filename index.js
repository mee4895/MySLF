var config = require('./config.js');
var Peer = require('peerjs');

document.getElementById('create').addEventListener('click', function() {
	var lobbyId = createLobby();
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

document.getElementById('send').addEventListener('click', function () {
	var yourMessage = document.getElementById('yourMessage').value;
	if (host) {
		host.send({
			msg: yourMessage
		});
	} else {
		peers.forEach(function(peer) {
			peer.send({
				msg: yourMessage
			});
		});
	}
});

var peers = [];
createLobby = function() {
	var lobbyId = Math.random().toString(36).substring(3, 8);
	var peer = new Peer('myslf-' + lobbyId, {key: config.apiKey});

	peer.on('connection', function(conn) {
		peers.push(conn);

		conn.on('open', function() {
			conn.send({
				msg: 'Hello from Server'
			});
		});
		conn.on('data', function(data){
			document.getElementById('messages').textContent += data.msg + '\n';
		});
	});

	return lobbyId;
};

var host;
joinLobby = function(lobbyId) {
	var peer = new Peer({key: config.apiKey});
	host = peer.connect('myslf-' + lobbyId);
	host.on('open', function() {
		host.send({
			msg: 'Hello from Client'
		});
	});
	host.on('data', function(data) {
		document.getElementById('messages').textContent += data.msg + '\n';
	});
};
