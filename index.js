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
	var yourMessage = _('yourMessage').value;
	if (hostConn) {
		hostConn.send({
			type: 'message',
			name: _('username').textContent,
			msg: yourMessage
		});
	} else if (peers.length != 0) {
		broadcast({
			type: 'message',
			name: _('username').textContent,
			msg: yourMessage
		});
	}
	_('messages').textContent += 'Ich: ' + yourMessage + '\n';
});
chatAddMessage = function(data, hasname = true) {
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
addUser = function(userid, username = 'loading ...') {
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
	}).append(jquery('<button></button>', {
		type: 'button',
		class: 'btn btn-outline-danger btn-block'
	}).text('Kick'))));
};

//
// Server
//
var peers = [];
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
			userid: Math.random().toString(36).substring(3, 8),
			connection: conn
		};

		conn.on('open', function() {
			addUser(peer.userid);
			conn.send({
				type: 'welcome',
				id: peer.userid,
				host: _('username').textContent,
			});
		});
		conn.on('data', serverReviece);

		peers.push(peer);
	});

	return lobbyId;
};

serverReviece = function(data) {
	if (data.type === 'message') {
		chatAddMessage(data);
	} else if (data.type === 'hello') {
		_('cardname-' + data.id).textContent = data.name;
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
		chatAddMessage(data);
	} else if (data.type === 'welcome') {
		myid = data.id;
		_('hostname').textContent = data.host;
		hostConn.send({
			type: 'hello',
			id: myid,
			name: _('username').textContent
		});
	} else if (data.type === 'join') {
		addUser(data.id, data.name);
	}
};
