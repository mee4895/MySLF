var Peer = require('simple-peer');
var peer = new Peer({
	initiator: location.hash === '#init',
	trickle: false
});

peer.on('signal', function (data) {
	dweetio.dweet_for("myslf-" + Math.random().toString(36).substring(3, 8), data, function(err, dweet) {
		document.getElementById('yourId').value = dweet.thing.substring(6);
	});
});

document.getElementById('connect').addEventListener('click', function () {
	var otherId = JSON.parse(document.getElementById('otherId').value);
	peer.signal(otherId);
});

document.getElementById('send').addEventListener('click', function () {
	var yourMessage = document.getElementById('yourMessage').value;
	peer.send(yourMessage);
});

peer.on('data', function (data) {
	document.getElementById('messages').textContent += data + '\n';
});

peer.on('stream', function (stream) {
	var video = document.createElement('video');
	document.body.appendChild(video);
	
	video.src = window.URL.createObjectURL(stream);
	video.play();
});
