require('./app.css');
var config = require('./config.js');
var Peer = require('peerjs');
var jquery = require("jquery");

//
// Cache
//
// jQuery cache
var jqCache = {};
function $(id) {
	if (!jqCache[id]) {
		jqCache[id] = jquery(id);
	}

	return jqCache[id];
}
// javascript cache
var jsCache = {};
function _(id) {
	if (!jsCache[id]) {
		jsCache[id] = document.getElementById(id);
	}

	return jsCache[id];
}

//
// UI
//
// Username
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

// Chat
_('toggleChat').addEventListener('click', function() {
	_('chat').hidden = !_('chat').hidden;
});
_('chat-header').addEventListener('click', function() {
	_('chat').hidden = true;
});
_('send').addEventListener('click', function () {
	var message = {
		type: 'message',
		name: _('username').textContent,
		msg: _('yourMessage').value
	}
	if (hostConn) {
		hostConn.send(message);
	} else if (peers.length != 0) {
		broadcast(message);
	}
	chatAddMessage(message);
});
chatAddMessage = function(data, hasname) {
	if (hasname) {
		_('messages').textContent += data.name + ': ' + data.msg + '\n';
	} else {
		_('messages').textContent += data.msg + '\n';
	}
	var div = _('messages').parentElement;
	div.scrollTop = div.scrollHeight - div.clientHeight;
};

// Lobby Select
_('create').addEventListener('click', function() {
	_('username').hidden = false;
	_('usernameInput').hidden = true;
	_('changeUsername').hidden = true;

	_('hostname').textContent = _('username').textContent;

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

// Lobby
addUser = function(userid, username, kick) {
	$('#peerlist').append(jquery('<div></div>', {
		id: 'card-' + userid,
		class: 'card',
		style: 'width: 10rem;'
	}).append(jquery('<img>', {
		class: 'card-img-top',
		src: 'profile-2092113.svg',
		alt: 'User'
	})).append(jquery('<div></div>', {
		class: 'card-body p-3'
	}).append(jquery('<h6></h6>', {
		id: 'cardname-' + userid,
		class: 'card-title mb-0'
	}).text(username))).append(jquery('<div></div>', {
		class: 'card-footer'
	}).append(kick ? jquery('<button></button>', {
		type: 'button',
		class: 'btn btn-outline-danger btn-block'
	}).text('Kick') : jquery('<button></button>', {
		type: 'button',
		class: 'btn btn-outline-success btn-block',
		disabled: true
	}).text('Player'))));
};

//
// Server
//
var peers = [];
getPeer = function(id) {
	for(var i = 0; i < peers.length; i++) {
		if(peers[i].id === id) {
			return peers[i];
		}
	}
};
getPeers = function() {
	var returnPeers = [];
	for(var i = 0; i < peers.length; i++) {
		if(peers[i].online) {
			returnPeers.push({
				id: peers[i].id,
				name: peers[i].name
			});
		}
	}
	return returnPeers;
}
broadcast = function(data) {
	peers.forEach(function(peer) {
		peer.connection.send(data);
	});
};
createLobby = function() {
	var lobbyId = Math.random().toString(36).substring(3, 8);
	var host = new Peer('myslf-' + lobbyId, {key: config.apiKey});

	chatAddMessage({msg:'Lobby <' + lobbyId + '> created!'}, false);
	chatAddMessage({msg:'Welcome to the Lobby.'}, false);

	host.on('connection', function(conn) {
		var peer = {
			id: Math.random().toString(36).substring(3, 8),
			connection: conn
		};

		conn.on('open', function() {
			addUser(peer.id, 'loading ...', true);
			conn.send({
				type: 'welcome',
				id: peer.id,
				host: _('username').textContent,
				peers: getPeers()
			});
		});
		conn.on('data', serverReviece);

		peers.push(peer);
	});

	return lobbyId;
};

serverReviece = function(data) {
	if (data.type === 'message') {
		chatAddMessage(data, true);
	} else if (data.type === 'hello') {
		_('cardname-' + data.id).textContent = data.name;
		var peer = getPeer(data.id);
		peer.name = data.name;
		peer.online = true;
		broadcast({
			type: 'join',
			id: data.id,
			name: data.name
		});
	}
};

//
// Client
//
var myid;
var hostConn;
joinLobby = function(lobbyId) {
	var peer = new Peer({key: config.apiKey});
	hostConn = peer.connect('myslf-' + lobbyId);
	hostConn.on('open', function() {
	});
	hostConn.on('data', clientRecieve);
};

clientRecieve = function(data) {
	if (data.type === 'message') {
		chatAddMessage(data, true);
	} else if (data.type === 'welcome') {
		myid = data.id;
		_('hostname').textContent = data.host;
		hostConn.send({
			type: 'hello',
			id: myid,
			name: _('username').textContent
		});
		data.peers.forEach(function(peer) {
			addUser(peer.id, peer.name, false);
		});
	} else if (data.type === 'join') {
		addUser(data.id, data.name, false);
	}
};
