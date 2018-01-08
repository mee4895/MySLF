require('./app.css');
var config = require('./config.js');
var Peer = require('peerjs');
var jquery = require("jquery");

var jqCache = {};
function $(id) {
	if (!jqCache[id]) {
		jqCache[id] = jquery(id);
	}

	return jqCache[id];
}

var jsCache = {};
function _(id) {
	if (!jsCache[id]) {
		jsCache[id] = document.getElementById(id);
	}

	return jsCache[id];
}
if (!localStorage.getItem('username')) {
	localStorage.setItem('username', 'Player-' + Math.random().toString(36).substring(3, 8));
}
_('username').textContent = localStorage.getItem('username');
_('changeUsername').addEventListener('click', function() {
	if (_('username').hidden) {
		_('usernameInput').hidden = true;
		localStorage.setItem('username', _('usernameInput').value);
		_('username').textContent = _('usernameInput').value;
		_('username').hidden = false;
	} else {
		_('username').hidden = true;
		_('usernameInput').value = localStorage.getItem('username');
		_('usernameInput').hidden = false;
	}
});
_('toggleChat').addEventListener('click', function() {
	_('chat').hidden = !_('chat').hidden;
});
_('chat-header').addEventListener('click', function() {
	_('chat').hidden = true;
});

_('create').addEventListener('click', function() {
	_('username').hidden = false;
	_('usernameInput').hidden = true;
	_('changeUsername').hidden = true;

	var lobbyId = createLobby();
	_('lobbycode').textContent = lobbyId;
	_('lobbyselect').hidden = true;
	_('lobby').hidden = false;
});

_('join').addEventListener('click', function() {
	_('username').hidden = false;
	_('usernameInput').hidden = true;
	_('changeUsername').hidden = true;

	joinLobby(_('lobbyid').value);
	_('lobbycode').textContent = _('lobbyid').value;
	_('lobbyselect').hidden = true;
	_('lobby').hidden = false;
});

_('send').addEventListener('click', function () {
	var yourMessage = _('yourMessage').value;
	if (host) {
		host.send({
			type: 'message',
			name: 'Player',
			msg: yourMessage
		});
	} else if (peers.length != 0) {
		peers.forEach(function(peer) {
			peer.send({
				type: 'message',
				name: 'Host',
				msg: yourMessage
			});
		});
	}
	_('messages').textContent += 'Ich: ' + yourMessage + '\n';
});

var peers = [];
createLobby = function() {
	var lobbyId = Math.random().toString(36).substring(3, 8);
	var peer = new Peer('myslf-' + lobbyId, {key: config.apiKey});

	peer.on('connection', function(conn) {
		peers.push(conn);

		conn.on('open', function() {
			conn.send({
				type: 'message',
				name: 'Host',
				msg: 'Hello from Server'
			});
		});
		conn.on('data', function(data){
			_('messages').textContent += data.name + ': ' + data.msg + '\n';
			var div = _('messages').parentElement;
			div.scrollTop = div.scrollHeight - div.clientHeight;
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
			type: 'message',
			name: 'Client',
			msg: 'Hello from Client'
		});
	});
	host.on('data', function(data) {
		_('messages').textContent += data.name + ': ' + data.msg + '\n';
		var div = _('messages').parentElement;
		div.scrollTop = div.scrollHeight - div.clientHeight;
	});
};
