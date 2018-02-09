module.exports = {
	initSettings: function(host, broadcast, $, _) {
		$('#gamesettings').append(`
			<div class="form-group">
				<label for="roundcount">Runden Anzahl:</label>
				<input type="number" id="roundCount" class="form-control" value="5" ${host ? '' : 'disabled'}>
			</div>
			<div class="form-group">
				<label for="letters">Buchstaben:</label>
				<input type="text" id="letters" class="form-control" value="ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ" ${host ? '' : 'disabled'}>
			</div>
			<div class="form-group">
				<label>Kategorien:</label>
				<div class="input-group">
					<input id="categoryinput_0" type="text" class="form-control categorySetting" ${host ? '' : 'disabled'}>
					<div class="input-group-append" ${host ? '' : 'hidden'}>
						<button id="addCategory" class="btn btn-outline-success" type="button" style="width:50px; z-index:0">+</button>
					</div>
				</div>
			</div>
		`);
		if (host) {
			$('#addCategory').on('click', function() {
				broadcast('category', {
					type: 'add',
					number: addCategorySetting(host, broadcast, $, _)
				});
			});
			$('#roundCount').on('change', function() {
				broadcast('category', {
					type: 'modify',
					number: -2,
					value: $('#roundCount').val()
				});
			});
			$('#letters').on('change', function() {
				broadcast('category', {
					type: 'modify',
					number: -1,
					value: $('#letters').val()
				});
			});
			$('#categoryinput_0').on('change', function() {
				broadcast('category', {
					type: 'modify',
					number: 0,
					value: $('#categoryinput_0').val()
				});
			});
		}
	},

	updateSettings: function(type, data, $, _) {
		if (type === 'category') {
			if (data.type === 'add') {
				addCategorySetting(false, null, $, _);
			} else if (data.type === 'modify') {
				if (data.number === -2) {
					$('#roundCount').val(data.value);
				} else if (data.number === -1) {
					$('#letters').val(data.value);
				} else {
					$('#categoryinput_' + data.number).val(data.value);
				}
			} else if (data.type === 'delete') {
				$('#categoryblock_' + data.number).remove();
			}
		}
	},

	getSettings: function($, _) {
		var categorys = [];
		var domElements = document.getElementsByClassName("categorySetting");
		for (var i = 0; i < domElements.length; i++) {
			categorys.push(domElements[i].value);
		};
		return {
			roundCount: $('#roundCount').val(),
			letters: $('#letters').val(),
			categorys: categorys
		}
	},

	runGame: function(host, settings, broadcast, $, _) {
		$('#game').append(`
			<h1 class="ml-2 mb-4">
				Round <span id="roundCounter"></span>:
			</h1>
			<div class="card mb-4">
				<div class="card-body">
					<h1 id="roundLetter" class="display-1" style="text-align:center;"></h1>
				</div>
			</div>
			<div id="gameCategorys" class="form mb-4"></div>
			<button id="endRound" class="btn btn-success btn-lg btn-block">Finish</button>
		`);
		for (var i = 0; i < settings.categorys.length; i++) {
			$('#gameCategorys').append(`
				<div id="gameCategoryBlock_${i}" class="form-group">
					<label>${settings.categorys[i]}:</label>
					<input id="gameCategoryInput_${i}" type="text" class="form-control game-category">
				</div>
			`);
		}
		$('#endRound').on('click', function() {
			broadcast('end', {});
		});
		if (host) {
			var data = {
				number: 1,
				letter: settings.letters[Math.floor(Math.random() * settings.letters.length)]
			};
			startRound(data.number, data.letter, $, _);
			broadcast('start', data);
		}
	},

	gameData: function(host, type, data, broadcast, $, _) {
		if (type === 'start') {
			startRound(data.number, data.letter, $, _);
		} else if (type === 'end') {
			if (host) {
				broadcast('end', {});
				startRound(2, '-', $, _)
			} else {
				startRound(2, '-', $, _);
			}
		}
	}
};

var count = 1;
addCategorySetting = function(host, broadcast, $, _) {
	$('#gamesettings').append(`
		<div id="categoryblock_${count}" class="form-group input-group">
			<input id="categoryinput_${count}" type="text" class="form-control categorySetting" ${host ? '' : 'disabled'}>
			<div class="input-group-append" ${host ? '' : 'hidden'}>
				<button id="categorybutton_${count}" class="btn btn-outline-danger" type="button" style="width:50px; z-index:0">-</button>
			</div>
		</div>
	`);
	if (host) {
		$('#categorybutton_' + count).on('click', (function(i) {
			return function() {
				$('#categoryblock_' + i).remove();
				broadcast('category', {
					type: 'delete',
					number: i
				});
			}
		})(count));
		$('#categoryinput_' + count).on('change', (function(i) {
			return function() {
				broadcast('category', {
					type: 'modify',
					number: i,
					value: $('#categoryinput_' + i).val()
				});
			}
		})(count));
	}
	return count++;
}

startRound = function(number, letter, $, _) {
	window.scrollTo(0, 0);
	$('#roundCounter').text(number);
	$('#roundLetter').text(letter);
	var domElements = document.getElementsByClassName("game-category");
	for (var i = 0; i < domElements.length; i++) {
		domElements[i].value = '';
	};
}
