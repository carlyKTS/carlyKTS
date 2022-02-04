//1st example
(function(global) {
	"use strict";

	// Helper utilities
	var util = {
		extend: function(src, props) {
			props = props || {};
			var p;
			for (p in src) {
				if (!props.hasOwnProperty(p)) {
					props[p] = src[p];
				}
			}
			return props;
		},
		each: function(a, b, c) {
			if ("[object Object]" === Object.prototype.toString.call(a)) {
				for (var d in a) {
					if (Object.prototype.hasOwnProperty.call(a, d)) {
						b.call(c, d, a[d], a);
					}
				}
			} else {
				for (var e = 0, f = a.length; e < f; e++) {
					b.call(c, e, a[e], a);
				}
			}
		},
		isNumber: function(n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		},
		includes: function(a, b) {
			return a.indexOf(b) > -1;
		},
	};

	/**
	 * Default configuration options. These can be overriden
	 * when loading a game instance.
	 * @property {Object}
	 */
	var defaultConfig = {
		// If set to true, the game will validate the numbers
		// as the player inserts them. If it is set to false,
		// validation will only happen at the end.
		validate_on_insert: true,

		// Set the difficult of the game.
		// This governs the amount of visible numbers
		// when starting a new game.
		difficulty: "normal"
	};

	/**
	 * Sudoku singleton engine
	 * @param {Object} config Configuration options
	 */
	function Game(config) {
		this.config = config;

		// Initialize game parameters
		this.cellMatrix = {};
		this.matrix = {};
		this.validation = {};

		this.values = [];

		this.resetValidationMatrices();

		return this;
	}
	/**
	 * Game engine prototype methods
	 * @property {Object}
	 */
	Game.prototype = {
		/**
		 * Build the game GUI
		 * @returns {HTMLTableElement} Table containing 9x9 input matrix
		 */
		buildGUI: function() {
			var td, tr;

			this.table = document.createElement("table");
			this.table.classList.add("sudoku-container");

			for (var i = 0; i < 9; i++) {
				tr = document.createElement("tr");
				this.cellMatrix[i] = {};

				for (var j = 0; j < 9; j++) {
					// Build the input
					this.cellMatrix[i][j] = document.createElement("input");
					this.cellMatrix[i][j].maxLength = 1;

					// Using dataset returns strings which means messing around parsing them later
					// Set custom properties instead
					this.cellMatrix[i][j].row = i;
					this.cellMatrix[i][j].col = j;

					this.cellMatrix[i][j].addEventListener("keyup", this.onKeyUp.bind(this));

					td = document.createElement("td");

					td.appendChild(this.cellMatrix[i][j]);

					// Calculate section ID
					var sectIDi = Math.floor(i / 3);
					var sectIDj = Math.floor(j / 3);
					// Set the design for different sections
					if ((sectIDi + sectIDj) % 2 === 0) {
						td.classList.add("sudoku-section-one");
					} else {
						td.classList.add("sudoku-section-two");
					}
					// Build the row
					tr.appendChild(td);
				}
				// Append to table
				this.table.appendChild(tr);
			}
			
			this.table.addEventListener("mousedown", this.onMouseDown.bind(this));

			// Return the GUI table
			return this.table;
		},

		/**
		 * Handle keyup events.
		 *
		 * @param {Event} e Keyup event
		 */
		onKeyUp: function(e) {
			var sectRow,
				sectCol,
				secIndex,
				val, row, col,
				isValid = true,
				input = e.currentTarget

			val = input.value.trim();
			row = input.row;
			col = input.col;

			// Reset board validation class
			this.table.classList.remove("valid-matrix");
			input.classList.remove("invalid");

			if (!util.isNumber(val)) {
				input.value = "";
				return false;
			}

			// Validate, but only if validate_on_insert is set to true
			if (this.config.validate_on_insert) {
				isValid = this.validateNumber(val, row, col, this.matrix.row[row][col]);
				// Indicate error
				input.classList.toggle("invalid", !isValid);
			}

			// Calculate section identifiers
			sectRow = Math.floor(row / 3);
			sectCol = Math.floor(col / 3);
			secIndex = row % 3 * 3 + col % 3;

			// Cache value in matrix
			this.matrix.row[row][col] = val;
			this.matrix.col[col][row] = val;
			this.matrix.sect[sectRow][sectCol][secIndex] = val;
		},
		
		onMouseDown: function(e) {
			var t = e.target;
			
			if ( t.nodeName === "INPUT" && t.classList.contains("disabled") ) {
				e.preventDefault();
			}
		},

		/**
		 * Reset the board and the game parameters
		 */
		resetGame: function() {
			this.resetValidationMatrices();
			for (var row = 0; row < 9; row++) {
				for (var col = 0; col < 9; col++) {
					// Reset GUI inputs
					this.cellMatrix[row][col].value = "";
				}
			}

			var inputs = this.table.getElementsByTagName("input");

			util.each(inputs, function(i, input) {
				input.classList.remove("disabled");
				input.tabIndex = 1;
			});

			this.table.classList.remove("valid-matrix");
		},

		/**
		 * Reset and rebuild the validation matrices
		 */
		resetValidationMatrices: function() {
			this.matrix = {
				row: {},
				col: {},
				sect: {}
			};
			this.validation = {
				row: {},
				col: {},
				sect: {}
			};

			// Build the row/col matrix and validation arrays
			for (var i = 0; i < 9; i++) {
				this.matrix.row[i] = ["", "", "", "", "", "", "", "", ""];
				this.matrix.col[i] = ["", "", "", "", "", "", "", "", ""];
				this.validation.row[i] = [];
				this.validation.col[i] = [];
			}

			// Build the section matrix and validation arrays
			for (var row = 0; row < 3; row++) {
				this.matrix.sect[row] = [];
				this.validation.sect[row] = {};
				for (var col = 0; col < 3; col++) {
					this.matrix.sect[row][col] = ["", "", "", "", "", "", "", "", ""];
					this.validation.sect[row][col] = [];
				}
			}
		},

		/**
		 * Validate the current number that was inserted.
		 *
		 * @param {String} num The value that is inserted
		 * @param {Number} rowID The row the number belongs to
		 * @param {Number} colID The column the number belongs to
		 * @param {String} oldNum The previous value
		 * @returns {Boolean} Valid or invalid input
		 */
		validateNumber: function(num, rowID, colID, oldNum) {
			var isValid = true,
				// Section
				sectRow = Math.floor(rowID / 3),
				sectCol = Math.floor(colID / 3),
				row = this.validation.row[rowID],
				col = this.validation.col[colID],
				sect = this.validation.sect[sectRow][sectCol];

			// This is given as the matrix component (old value in
			// case of change to the input) in the case of on-insert
			// validation. However, in the solver, validating the
			// old number is unnecessary.
			oldNum = oldNum || "";

			// Remove oldNum from the validation matrices,
			// if it exists in them.
			if (util.includes(row, oldNum)) {
				row.splice(row.indexOf(oldNum), 1);
			}
			if (util.includes(col, oldNum)) {
				col.splice(col.indexOf(oldNum), 1);
			}
			if (util.includes(sect, oldNum)) {
				sect.splice(sect.indexOf(oldNum), 1);
			}
			// Skip if empty value

			if (num !== "") {
				// Validate value
				if (
					// Make sure value is within range
					Number(num) > 0 &&
					Number(num) <= 9
				) {
					// Check if it already exists in validation array
					if (
						util.includes(row, num) ||
						util.includes(col, num) ||
						util.includes(sect, num)
					) {
						isValid = false;
					} else {
						isValid = true;
					}
				}

				// Insert new value into validation array even if it isn't
				// valid. This is on purpose: If there are two numbers in the
				// same row/col/section and one is replaced, the other still
				// exists and should be reflected in the validation.
				// The validation will keep records of duplicates so it can
				// remove them safely when validating later changes.
				row.push(num);
				col.push(num);
				sect.push(num);
			}

			return isValid;
		},

		/**
		 * Validate the entire matrix
		 * @returns {Boolean} Valid or invalid matrix
		 */
		validateMatrix: function() {
			var isValid, val, $element, hasError = false;

			// Go over entire board, and compare to the cached
			// validation arrays
			for (var row = 0; row < 9; row++) {
				for (var col = 0; col < 9; col++) {
					val = this.matrix.row[row][col];
					// Validate the value
					isValid = this.validateNumber(val, row, col, val);
					this.cellMatrix[row][col].classList.toggle("invalid", !isValid);
					if (!isValid) {
						hasError = true;
					}
				}
			}
			return !hasError;
		},

		/**
		 * A recursive 'backtrack' solver for the
		 * game. Algorithm is based on the StackOverflow answer
		 * http://stackoverflow.com/questions/18168503/recursively-solving-a-sudoku-puzzle-using-backtracking-theoretically
		 */
		solveGame: function(row, col, string) {
			var cval,
				sqRow,
				sqCol,
				nextSquare,
				legalValues,
				sectRow,
				sectCol,
				secIndex,
				gameResult;

			nextSquare = this.findClosestEmptySquare(row, col);
			if (!nextSquare) {
				// End of board
				return true;
			} else {
				sqRow = nextSquare.row;
				sqCol = nextSquare.col;
				legalValues = this.findLegalValuesForSquare(sqRow, sqCol);

				// Find the segment id
				sectRow = Math.floor(sqRow / 3);
				sectCol = Math.floor(sqCol / 3);
				secIndex = sqRow % 3 * 3 + sqCol % 3;

				// Try out legal values for this cell
				for (var i = 0; i < legalValues.length; i++) {
					cval = legalValues[i];
					// Update value in input
					nextSquare.value = string ? "" : cval;

					// Update in matrices
					this.matrix.row[sqRow][sqCol] = cval;
					this.matrix.col[sqCol][sqRow] = cval;
					this.matrix.sect[sectRow][sectCol][secIndex] = cval;

					// Recursively keep trying
					if (this.solveGame(sqRow, sqCol, string)) {
						return true;
					} else {
						// There was a problem, we should backtrack


						// Remove value from input
						this.cellMatrix[sqRow][sqCol].value = "";
						// Remove value from matrices
						this.matrix.row[sqRow][sqCol] = "";
						this.matrix.col[sqCol][sqRow] = "";
						this.matrix.sect[sectRow][sectCol][secIndex] = "";
					}
				}

				// If there was no success with any of the legal
				// numbers, call backtrack recursively backwards
				return false;
			}
		},

		/**
		 * Find closest empty square relative to the given cell.
		 *
		 * @param {Number} row Row id
		 * @param {Number} col Column id
		 * @returns {jQuery} Input element of the closest empty
		 *  square
		 */
		findClosestEmptySquare: function(row, col) {
			var walkingRow, walkingCol, found = false;
			for (var i = col + 9 * row; i < 81; i++) {
				walkingRow = Math.floor(i / 9);
				walkingCol = i % 9;
				if (this.matrix.row[walkingRow][walkingCol] === "") {
					found = true;
					return this.cellMatrix[walkingRow][walkingCol];
				}
			}
		},

		/**
		 * Find the available legal numbers for the square in the
		 * given row and column.
		 *
		 * @param {Number} row Row id
		 * @param {Number} col Column id
		 * @returns {Array} An array of available numbers
		 */
		findLegalValuesForSquare: function(row, col) {
			var temp,
				legalVals,
				legalNums,
				val,
				i,
				sectRow = Math.floor(row / 3),
				sectCol = Math.floor(col / 3);

			legalNums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

			// Check existing numbers in col
			for (i = 0; i < 9; i++) {
				val = Number(this.matrix.col[col][i]);
				if (val > 0) {
					// Remove from array
					if (util.includes(legalNums, val)) {
						legalNums.splice(legalNums.indexOf(val), 1);
					}
				}
			}

			// Check existing numbers in row
			for (i = 0; i < 9; i++) {
				val = Number(this.matrix.row[row][i]);
				if (val > 0) {
					// Remove from array
					if (util.includes(legalNums, val)) {
						legalNums.splice(legalNums.indexOf(val), 1);
					}
				}
			}

			// Check existing numbers in section
			sectRow = Math.floor(row / 3);
			sectCol = Math.floor(col / 3);
			for (i = 0; i < 9; i++) {
				val = Number(this.matrix.sect[sectRow][sectCol][i]);
				if (val > 0) {
					// Remove from array
					if (util.includes(legalNums, val)) {
						legalNums.splice(legalNums.indexOf(val), 1);
					}
				}
			}

			// Shuffling the resulting 'legalNums' array will
			// make sure the solver produces different answers
			// for the same scenario. Otherwise, 'legalNums'
			// will be chosen in sequence.
			for (i = legalNums.length - 1; i > 0; i--) {
				var rand = getRandomInt(0, i);
				temp = legalNums[i];
				legalNums[i] = legalNums[rand];
				legalNums[rand] = temp;
			}

			return legalNums;
		}
	};

	/**
	 * Get a random integer within a range
	 *
	 * @param {Number} min Minimum number
	 * @param {Number} max Maximum range
	 * @returns {Number} Random number within the range (Inclusive)
	 */
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max + 1)) + min;
	}

	/**
	 * Get a number of random array items
	 *
	 * @param {Array} array The array to pick from
	 * @param {Number} count Number of items
	 * @returns {Array} Array of items
	 */
	function getUnique(array, count) {
		// Make a copy of the array
		var tmp = array.slice(array);
		var ret = [];

		for (var i = 0; i < count; i++) {
			var index = Math.floor(Math.random() * tmp.length);
			var removed = tmp.splice(index, 1);

			ret.push(removed[0]);
		}
		return ret;
	}

	function triggerEvent(el, type) {
		if ('createEvent' in document) {
			// modern browsers, IE9+
			var e = document.createEvent('HTMLEvents');
			e.initEvent(type, false, true);
			el.dispatchEvent(e);
		} else {
			// IE 8
			var e = document.createEventObject();
			e.eventType = type;
			el.fireEvent('on' + e.eventType, e);
		}
	}

	var Sudoku = function(container, settings) {
		this.container = container;

		if (typeof container === "string") {
			this.container = document.querySelector(container);
		}

		this.game = new Game(util.extend(defaultConfig, settings));

		this.container.appendChild(this.getGameBoard());
	};

	Sudoku.prototype = {
		/**
		 * Return a visual representation of the board
		 * @returns {jQuery} Game table
		 */
		getGameBoard: function() {
			return this.game.buildGUI();
		},

		newGame: function() {
			var that = this;
			this.reset();

			setTimeout(function() {
				that.start();
			}, 20);
		},

		/**
		 * Start a game.
		 */
		start: function() {
			var arr = [],
				x = 0,
				values,
				rows = this.game.matrix.row,
				inputs = this.game.table.getElementsByTagName("input"),
				difficulties = {
					"easy": 50,
					"normal": 40,
					"hard": 30,
				};

			// Solve the game to get the solution
			this.game.solveGame(0, 0);

			util.each(rows, function(i, row) {
				util.each(row, function(r, val) {
					arr.push({
						index: x,
						value: val
					});
					x++;
				});
			});

			// Get random values for the start of the game
			values = getUnique(arr, difficulties[this.game.config.difficulty]);

			// Reset the game
			this.reset();

			util.each(values, function(i, data) {
				var input = inputs[data.index];
				input.value = data.value;
				input.classList.add("disabled");
				input.tabIndex = -1;
				triggerEvent(input, 'keyup');
			});
		},

		/**
		 * Reset the game board.
		 */
		reset: function() {
			this.game.resetGame();
		},

		/**
		 * Call for a validation of the game board.
		 * @returns {Boolean} Whether the board is valid
		 */
		validate: function() {
			var isValid;

			isValid = this.game.validateMatrix();
			this.game.table.classList.toggle("valid-matrix", isValid);
		},

		/**
		 * Call for the solver routine to solve the current
		 * board.
		 */
		solve: function() {
			var isValid;
			// Make sure the board is valid first
			if (!this.game.validateMatrix()) {
				return false;
			}

			// Solve the game
			isValid = this.game.solveGame(0, 0);

			// Visual indication of whether the game was solved
			this.game.table.classList.toggle("valid-matrix", isValid);

			if (isValid) {
				var inputs = this.game.table.getElementsByTagName("input");

				util.each(inputs, function(i, input) {
					input.classList.add("disabled");
					input.tabIndex = -1;
				});
			}
		}
	};

	global.Sudoku = Sudoku;
})(this);

var game = new Sudoku(".container");

game.start();

// Controls

const container = document.querySelector(".sudoku-container");
const inputs = Array.from(document.querySelectorAll("input"));
container.addEventListener("click", e => {
	const el = e.target.closest("input");
	
	if ( el ) {
		inputs.forEach(input => {
			input.classList.toggle("highlight", input.value && input.value === el.value );
		});
	}
}, false);


document.getElementById("controls").addEventListener("click", function(e) {

	var t = e.target;

	if (t.nodeName.toLowerCase() === "button") {
		game[t.dataset.action]();
	}
});


//2nd Example
const ALL_DIGITS = ['1','2','3','4','5','6','7','8','9']
const ANSWER_COUNT = {EASY: 1, NORMAL: 2, HARD: 3}
const ROUND_COUNT = 3
const SCORE_RULE = {CORRECT: 100, WRONG: -10}

const $ = (selector) => document.querySelectorAll(selector)
const dom = {
    game: $('.game')[0],
    digits: Array.from($('.game .digits span')),
    time: $('.game .time')[0],
    round: $('.game .round')[0],
    score: $('.game .score')[0],
    selectLevel: $('.select-level')[0],
    level: () => {return $('input[type=radio]:checked')[0]},
    play: $('.select-level .play')[0],
    gameOver: $('.game-over')[0],
    again: $('.game-over .again')[0],
    finalTime: $('.game-over .final-time')[0],
    finalScore: $('.game-over .final-score')[0],
}

const render = {
    initDigits: (texts) => {
        allTexts = texts.concat(_.fill(Array(ALL_DIGITS.length - texts.length), ''))
        _.shuffle(dom.digits).forEach((digit, i) => {
            digit.innerText = allTexts[i]
            digit.className = ''
        })
    },
    updateDigitStatus: (text, isAnswer) => {
        if (isAnswer) {
            let digit = _.find(dom.digits, x => (x.innerText == ''))
            digit.innerText = text
            digit.className = 'correct'
        }
        else {
            _.find(dom.digits, x => (x.innerText == text)).className = 'wrong'
        }
    },
    updateTime: (value) => {
        dom.time.innerText = value
    },
    updateScore: (value) => {
        dom.score.innerText = value.toString()
    },
    updateRound: (value) => {
        dom.round.innerText = [
            value.toString(),
            '/',
            ROUND_COUNT.toString(),
        ].join('')
    },
    updateFinal: () => {
        dom.finalTime.innerText = dom.time.innerText
        dom.finalScore.innerText = dom.score.innerText
    },
}

const animation = {
    digitsFrameOut: () => {
        return new Promise(resolve => {
            new TimelineMax()
                .staggerTo(dom.digits, 0, {rotation: 0})
                .staggerTo(dom.digits, 1, {rotation: 360, scale: 0, delay: 0.5})
                .timeScale(2)
                .eventCallback('onComplete', resolve)
        })
    },
    digitsFrameIn: () => {
        return new Promise(resolve => {
            new TimelineMax()
                .staggerTo(dom.digits, 0, {rotation: 0})
                .staggerTo(dom.digits, 1, {rotation: 360, scale: 1}, 0.1)
                .timeScale(2)
                .eventCallback('onComplete', resolve)
        })
    },
    showUI: (element) => {
        dom.game.classList.add('stop')
        return new Promise(resolve => {
            new TimelineMax()
                .to(element, 0, {visibility: 'visible', x: 0})
                .from(element, 1, {y: '-300px', ease: Elastic.easeOut.config(1, 0.3)})
                .timeScale(1)
                .eventCallback('onComplete', resolve)
        })
    },
    hideUI: (element) => {
        dom.game.classList.remove('stop')
        return new Promise(resolve => {
            new TimelineMax()
                .to(element, 1, {x: '300px', ease: Power4.easeIn})
                .to(element, 0, {visibility: 'hidden'})
                .timeScale(2)
                .eventCallback('onComplete', resolve)
        })
    },
}

let answerCount, digits, round, score, timer, canPress

window.onload = init

function init() {
    dom.play.addEventListener('click', startGame)
    dom.again.addEventListener('click', playAgain)
    window.addEventListener('keyup', pressKey)

    newGame()
}

async function newGame() {
    round = 0
    score = 0
    timer = new Timer(render.updateTime)
    canPress = false

    await animation.showUI(dom.selectLevel)
}

async function startGame() {
    render.updateRound(1)
    render.updateScore(0)
    render.updateTime('00:00')

    await animation.hideUI(dom.selectLevel)

    answerCount = ANSWER_COUNT[dom.level().value.toUpperCase()]
    newRound()
    timer.start()
    canPress = true
}

async function newRound() {
    await animation.digitsFrameOut()

    digits = _.shuffle(ALL_DIGITS).map((x, i) => {
        return {
            text: x,
            isAnwser: (i < answerCount),
            isPressed: false
        }
    })
    render.initDigits(_.filter(digits, x => !x.isAnwser).map(x => x.text))

    await animation.digitsFrameIn()

    round++
    render.updateRound(round)
}

async function gameOver() {
    canPress = false
    timer.stop()
    render.updateFinal()
    
    await animation.showUI(dom.gameOver)
}

async function playAgain() {
    await animation.hideUI(dom.gameOver)

    newGame()
}

function pressKey(e) {
    if (!canPress) return;
    if (!ALL_DIGITS.includes(e.key)) return;

    let digit = _.find(digits, x => (x.text == e.key))
    if (digit.isPressed) return;

    digit.isPressed = true
    render.updateDigitStatus(digit.text, digit.isAnwser)

    score += digit.isAnwser ? SCORE_RULE.CORRECT : SCORE_RULE.WRONG
    render.updateScore(score)

    let hasPressedAllAnswerDigits = (_.filter(digits, (x) => (x.isAnwser && x.isPressed)).length == answerCount)
    if (!hasPressedAllAnswerDigits) return;
    
    let hasPlayedAllRounds = (round == ROUND_COUNT)
    if (hasPlayedAllRounds) {
        gameOver()
    } else {
        newRound()
    }
}

function Timer(render) {
    this.render = render
    this.t = {}
    this.time = {
        minute: 0,
        second: 0,
    }
    this.tickTock = () => {
        this.time.second++;
        if (this.time.second == 60) {
            this.time.minute++
            this.time.second = 0
        }

        this.render([
            this.time.minute.toString().padStart(2, '0'),
            ':',
            this.time.second.toString().padStart(2, '0'),
        ].join(''))
    }
    this.start = () => {
        this.t = setInterval(this.tickTock, 1000)
    }
    this.stop = () => {
        clearInterval(this.t)
    }
}

//3rd Example about handling popup window from Wiki
function isCompatible(ua) {
    return !!((function() {
        'use strict';
        return !this && Function.prototype.bind;
    }()) && 'querySelector' in document && 'localStorage' in window && !ua.match(/MSIE 10|NetFront|Opera Mini|S40OviBrowser|MeeGo|Android.+Glass|^Mozilla\/5\.0 .+ Gecko\/$|googleweblight|PLAYSTATION|PlayStation/));
}
if (!isCompatible(navigator.userAgent)) {
    document.documentElement.className = document.documentElement.className.replace(/(^|\s)client-js(\s|$)/, '$1client-nojs$2');
    while (window.NORLQ && NORLQ[0]) {
        NORLQ.shift()();
    }
    NORLQ = {
        push: function(fn) {
            fn();
        }
    };
    RLQ = {
        push: function() {}
    };
} else {
    if (window.performance && performance.mark) {
        performance.mark('mwStartup');
    }
    (function() {
        'use strict';
        var mw,
            log,
            con = window.console;
        function logError(topic, data) {
            var msg,
                e = data.exception;
            if (con.log) {
                msg = (e ? 'Exception' : 'Error') + ' in ' + data.source + (data.module ? ' in module ' + data.module : '') + (e ? ':' : '.');
                con.log(msg);
                if (e && con.warn) {
                    con.warn(e);
                }
            }
        }
        function Map() {
            this.values = Object.create(null);
        }
        Map.prototype = {
            constructor: Map,
            get:
            function(selection, fallback) {
                var results,
                    i;
                fallback = arguments.length > 1 ? fallback : null;
                if (Array.isArray(selection)) {
                    results = {};
                    for (i = 0; i < selection.length; i++) {
                        if (typeof selection[i] === 'string') {
                            results[selection[i]] = selection[i] in this.values ? this.values[selection[i]] : fallback;
                        }
                    }
                    return results;
                }
                if (typeof selection === 'string') {
                    return selection in this.values ? this.values[selection] : fallback;
                }
                if (selection === undefined) {
                    results = {};
                    for (i in this.values) {
                        results[i] = this.values[i];
                    }
                    return results;
                }
                return fallback;
            },
            set: function(selection, value) {
                if (arguments.length > 1) {
                    if (typeof selection === 'string') {
                        this.values[selection] = value;
                        return true;
                    }
                } else if (typeof selection === 'object') {
                    for (var s in selection) {
                        this.values[s] = selection[s];
                    }
                    return true;
                }
                return false;
            },
            exists: function(selection) {
                return typeof selection === 'string' && selection in this.values;
            }
        };
        log = function() {};
        log.warn = con.warn ? Function.prototype.bind.call(con.warn, con) : function() {};
        mw = {
            now: function() {
                var perf = window.performance,
                    navStart = perf
                    && perf.timing && perf.timing.navigationStart;
                mw.now = navStart && perf.now ? function() {
                    return navStart + perf.now();
                } : Date.now;
                return mw.now();
            },
            trackQueue: [],
            track: function(topic, data) {
                mw.trackQueue.push({
                    topic: topic,
                    data: data
                });
            },
            trackError: function(topic, data) {
                mw.track(topic, data);
                logError(topic, data);
            },
            Map: Map,
            config: new Map(),
            messages: new Map(),
            templates: new Map(),
            log: log
        };
        window.mw = window.mediaWiki = mw;
    }());
    (function() {
        'use strict';
        var StringSet,
            store,
            hasOwn = Object.hasOwnProperty;
        function defineFallbacks() {
            StringSet = window.Set || function() {
                var set = Object.create(null);
                return {
                    add: function(value) {
                        set[value] = true;
                    },
                    has: function(value) {
                        return value in set;
                    }
                };
            };
        }
        defineFallbacks();
        function fnv132(str) {
            var hash = 0x811C9DC5,
                i = 0;
            for (; i < str.length; i++) {
                hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
                hash ^= str.charCodeAt(i);
            }
            hash = (hash >>> 0).toString(36).slice(0, 5);
            while (hash.length < 5) {
                hash = '0' + hash;
            }
            return hash;
        }
        var isES6Supported = typeof Promise === 'function' && Promise.prototype.finally && /./g.
        flags === 'g' && (function() {
            try {
                new Function('var \ud800\udec0;');
                return true;
            } catch (e) {
                return false;
            }
        }());
        var registry = Object.create(null),
            sources = Object.create(null),
            handlingPendingRequests = false,
            pendingRequests = [],
            queue = [],
            jobs = [],
            willPropagate = false,
            errorModules = [],
            baseModules = ["jquery", "mediawiki.base"],
            marker = document.querySelector('meta[name="ResourceLoaderDynamicStyles"]'),
            lastCssBuffer,
            rAF = window.requestAnimationFrame || setTimeout;
        function newStyleTag(text, nextNode) {
            var el = document.createElement('style');
            el.appendChild(document.createTextNode(text));
            if (nextNode && nextNode.parentNode) {
                nextNode.parentNode.insertBefore(el, nextNode);
            } else {
                document.head.appendChild(el);
            }
            return el;
        }
        function flushCssBuffer(cssBuffer) {
            if (cssBuffer === lastCssBuffer) {
                lastCssBuffer = null;
            }
            newStyleTag(cssBuffer.cssText, marker);
            for (var i = 0; i < cssBuffer.callbacks.length; i++) {
                cssBuffer.callbacks[i]();
            }
        }
        function addEmbeddedCSS(cssText, callback) {
            if (!lastCssBuffer || cssText.slice(0, 7) === '@import') {
                lastCssBuffer = {
                    cssText
                    : '',
                    callbacks: []
                };
                rAF(flushCssBuffer.bind(null, lastCssBuffer));
            }
            lastCssBuffer.cssText += '\n' + cssText;
            lastCssBuffer.callbacks.push(callback);
        }
        function getCombinedVersion(modules) {
            var hashes = modules.reduce(function(result, module) {
                return result + registry[module].version;
            }, '');
            return fnv132(hashes);
        }
        function allReady(modules) {
            for (var i = 0; i < modules.length; i++) {
                if (mw.loader.getState(modules[i]) !== 'ready') {
                    return false;
                }
            }
            return true;
        }
        function allWithImplicitReady(module) {
            return allReady(registry[module].dependencies) && (baseModules.indexOf(module) !== -1 || allReady(baseModules));
        }
        function anyFailed(modules) {
            for (var i = 0; i < modules.length; i++) {
                var state = mw.loader.getState(modules[i]);
                if (state === 'error' || state === 'missing') {
                    return modules[i];
                }
            }
            return false;
        }
        function doPropagation() {
            var module,
                i,
                job,
                didPropagate = true;
            while (didPropagate) {
                didPropagate = false;
                while (errorModules.length) {
                    var errorModule = errorModules.shift(),
                        baseModuleError = baseModules.indexOf(errorModule) !== -1;
                    for (module in registry) {
                        if (
                        registry[module].state !== 'error' && registry[module].state !== 'missing') {
                            if (baseModuleError && baseModules.indexOf(module) === -1) {
                                registry[module].state = 'error';
                                didPropagate = true;
                            } else if (registry[module].dependencies.indexOf(errorModule) !== -1) {
                                registry[module].state = 'error';
                                errorModules.push(module);
                                didPropagate = true;
                            }
                        }
                    }
                }
                for (module in registry) {
                    if (registry[module].state === 'loaded' && allWithImplicitReady(module)) {
                        execute(module);
                        didPropagate = true;
                    }
                }
                for (i = 0; i < jobs.length; i++) {
                    job = jobs[i];
                    var failed = anyFailed(job.dependencies);
                    if (failed !== false || allReady(job.dependencies)) {
                        jobs.splice(i, 1);
                        i -= 1;
                        try {
                            if (failed !== false && job.error) {
                                job.error(new Error('Failed dependency: ' + failed), job.dependencies);
                            } else if (failed === false && job.ready) {
                                job.ready();
                            }
                        } catch (e) {
                            mw.trackError('resourceloader.exception', {
                                exception: e,
                                source: 'load-callback'
                            });
                        }
                        didPropagate = true;
                    }
                }
            }
            willPropagate = false;
        }
        function setAndPropagate(module, state) {
            registry[module].state = state;
            if (state === 'ready') {
                store.add(module);
            } else if (state ===
            'error' || state === 'missing') {
                errorModules.push(module);
            } else if (state !== 'loaded') {
                return;
            }
            if (willPropagate) {
                return;
            }
            willPropagate = true;
            mw.requestIdleCallback(doPropagation, {
                timeout: 1
            });
        }
        function sortDependencies(module, resolved, unresolved) {
            var e;
            if (!(module in registry)) {
                e = new Error('Unknown module: ' + module);
                e.name = 'DependencyError';
                throw e;
            }
            if (!isES6Supported && registry[module].requiresES6) {
                e = new Error('Module requires ES6 but ES6 is not supported: ' + module);
                e.name = 'ES6Error';
                throw e;
            }
            if (typeof registry[module].skip === 'string') {
                var skip = (new Function(registry[module].skip)());
                registry[module].skip = !!skip;
                if (skip) {
                    registry[module].dependencies = [];
                    setAndPropagate(module, 'ready');
                    return;
                }
            }
            if (!unresolved) {
                unresolved = new StringSet();
            }
            var deps = registry[module].dependencies;
            unresolved.add(module);
            for (var i = 0; i < deps.length; i++) {
                if (resolved.indexOf(deps[i]) === -1) {
                    if (unresolved.has(deps[i])) {
                        e = new Error('Circular reference detected: ' + module + ' -> ' + deps[i]);
                        e.name = 'DependencyError';
                        throw e;
                    }
                    sortDependencies(deps[i], resolved, unresolved);
                }
            }
            resolved.push(module);
        }
        function resolve(modules) {
            var resolved = baseModules.slice(),
                i = 0;
            for (; i < modules.length; i++) {
                sortDependencies(modules[i], resolved);
            }
            return resolved;
        }
        function resolveStubbornly(modules) {
            var saved,
                resolved = baseModules.slice(),
                i = 0;
            for (; i < modules.length; i++) {
                saved = resolved.slice();
                try {
                    sortDependencies(modules[i], resolved);
                } catch (err) {
                    resolved = saved;
                    if (err.name === 'ES6Error') {
                        mw.log.warn('Skipped ES6-only module ' + modules[i]);
                    } else {
                        mw.log.warn('Skipped unresolvable module ' + modules[i]);
                        if (modules[i] in registry) {
                            mw.trackError('resourceloader.exception', {
                                exception: err,
                                source: 'resolve'
                            });
                        }
                    }
                }
            }
            return resolved;
        }
        function resolveRelativePath(relativePath, basePath) {
            var relParts = relativePath.match(/^((?:\.\.?\/)+)(.*)$/);
            if (!relParts) {
                return null;
            }
            var baseDirParts = basePath.split('/');
            baseDirParts.pop();
            var prefixes = relParts[1].split('/');
            prefixes.pop();
            var prefix;
            while ((prefix = prefixes.pop()) !== undefined) {
                if (prefix === '..') {
                    baseDirParts.pop();
                }
            }
            return (baseDirParts.length ? baseDirParts.join('/') + '/' : '') + relParts[2];
        }
        function makeRequireFunction(moduleObj, basePath) {
            return function require(moduleName) {
                var fileName = resolveRelativePath(moduleName, basePath);
                if (fileName === null) {
                    return mw.loader.require(moduleName);
                }
                if (hasOwn.call(moduleObj.packageExports, fileName)) {
                    return moduleObj.packageExports[fileName];
                }
                var scriptFiles = moduleObj.script.files;
                if (!hasOwn.call(scriptFiles, fileName)) {
                    throw new Error('Cannot require undefined file ' + fileName);
                }
                var result,
                    fileContent = scriptFiles[fileName];
                if (typeof fileContent === 'function') {
                    var moduleParam = {
                        exports: {}
                    };
                    fileContent(makeRequireFunction(moduleObj, fileName), moduleParam);
                    result = moduleParam.exports;
                } else {
                    result = fileContent;
                }
                moduleObj.packageExports[fileName] = result;
                return result;
            };
        }
        function addScript(src, callback) {
            var script = document.createElement('script');
            script.src = src;
            script.onload = script.onerror = function() {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                if (callback) {
                    callback();
                    callback = null;
                }
            };
            document.head.appendChild(script);
        }
        function queueModuleScript(src, moduleName, callback) {
            pendingRequests.push(function() {
                if (moduleName !== 'jquery') {
                    window.require = mw.loader.require;
                    window.module = registry[moduleName].module;
                }
                addScript(src, function() {
                    delete window.module;
                    callback();
                    if (pendingRequests[0]) {
                        pendingRequests.shift()();
                    } else {
                        handlingPendingRequests = false;
                    }
                });
            });
            if (!handlingPendingRequests && pendingRequests[0]) {
                handlingPendingRequests = true;
                pendingRequests.shift()();
            }
        }
        function addLink(url, media, nextNode) {
            var el = document.createElement('link');
            el.rel = 'stylesheet';
            if (media) {
                el.media = media;
            }
            el.href = url;
            if (nextNode && nextNode.parentNode) {
                nextNode.parentNode.insertBefore(el, nextNode);
            } else {
                document.head.appendChild(el);
            }
        }
        function domEval(code) {
            var script = document.createElement('script');
            if (mw.config.get('wgCSPNonce') !== false) {
                script.nonce = mw.config.get('wgCSPNonce');
            }
            script.text = code;
            document.head.appendChild(script);
            script.parentNode.removeChild(
            script);
        }
        function enqueue(dependencies, ready, error) {
            if (allReady(dependencies)) {
                if (ready) {
                    ready();
                }
                return;
            }
            var failed = anyFailed(dependencies);
            if (failed !== false) {
                if (error) {
                    error(new Error('Dependency ' + failed + ' failed to load'), dependencies);
                }
                return;
            }
            if (ready || error) {
                jobs.push({
                    dependencies: dependencies.filter(function(module) {
                        var state = registry[module].state;
                        return state === 'registered' || state === 'loaded' || state === 'loading' || state === 'executing';
                    }),
                    ready: ready,
                    error: error
                });
            }
            dependencies.forEach(function(module) {
                if (registry[module].state === 'registered' && queue.indexOf(module) === -1) {
                    queue.push(module);
                }
            });
            mw.loader.work();
        }
        function execute(module) {
            var value,
                i,
                siteDeps,
                siteDepErr,
                cssPending = 0;
            if (registry[module].state !== 'loaded') {
                throw new Error('Module in state "' + registry[module].state + '" may not execute: ' + module);
            }
            registry[module].state = 'executing';
            var runScript = function() {
                var script = registry[module].script;
                var markModuleReady = function() {
                    setAndPropagate(module, 'ready');
                };
                var
                nestedAddScript = function(arr, j) {
                    if (j >= arr.length) {
                        markModuleReady();
                        return;
                    }
                    queueModuleScript(arr[j], module, function() {
                        nestedAddScript(arr, j + 1);
                    });
                };
                try {
                    if (Array.isArray(script)) {
                        nestedAddScript(script, 0);
                    } else if (typeof script === 'function') {
                        if (module === 'jquery') {
                            script();
                        } else {
                            script(window.$, window.$, mw.loader.require, registry[module].module);
                        }
                        markModuleReady();
                    } else if (typeof script === 'object' && script !== null) {
                        var mainScript = script.files[script.main];
                        if (typeof mainScript !== 'function') {
                            throw new Error('Main file in module ' + module + ' must be a function');
                        }
                        mainScript(makeRequireFunction(registry[module], script.main), registry[module].module);
                        markModuleReady();
                    } else if (typeof script === 'string') {
                        domEval(script);
                        markModuleReady();
                    } else {
                        markModuleReady();
                    }
                } catch (e) {
                    setAndPropagate(module, 'error');
                    mw.trackError('resourceloader.exception', {
                        exception: e,
                        module: module,
                        source: 'module-execute'
                    });
                }
            };
            if (registry[module].messages) {
                mw.messages.set(registry[module].messages);
            }
            if (registry[module].
            templates) {
                mw.templates.set(module, registry[module].templates);
            }
            var cssHandle = function() {
                cssPending++;
                return function() {
                    cssPending--;
                    if (cssPending === 0) {
                        var runScriptCopy = runScript;
                        runScript = undefined;
                        runScriptCopy();
                    }
                };
            };
            if (registry[module].style) {
                for (var key in registry[module].style) {
                    value = registry[module].style[key];
                    if (key === 'css') {
                        for (i = 0; i < value.length; i++) {
                            addEmbeddedCSS(value[i], cssHandle());
                        }
                    } else if (key === 'url') {
                        for (var media in value) {
                            var urls = value[media];
                            for (i = 0; i < urls.length; i++) {
                                addLink(urls[i], media, marker);
                            }
                        }
                    }
                }
            }
            if (module === 'user') {
                try {
                    siteDeps = resolve(['site']);
                } catch (e) {
                    siteDepErr = e;
                    runScript();
                }
                if (!siteDepErr) {
                    enqueue(siteDeps, runScript, runScript);
                }
            } else if (cssPending === 0) {
                runScript();
            }
        }
        function sortQuery(o) {
            var key,
                sorted = {},
                a = [];
            for (key in o) {
                a.push(key);
            }
            a.sort();
            for (key = 0; key < a.length; key++) {
                sorted[a[key]] = o[a[key]];
            }
            return sorted;
        }
        function buildModulesString(moduleMap) {
            var p,
                prefix,
                str = [],
                list = [];
            function restore(suffix) {
                return p + suffix;
            }
            for (prefix in moduleMap) {
                p = prefix === '' ? '' : prefix + '.';
                str.push(p + moduleMap[prefix].join(','));
                list.push.apply(list, moduleMap[prefix].map(restore));
            }
            return {
                str: str.join('|'),
                list: list
            };
        }
        function makeQueryString(params) {
            return Object.keys(params).map(function(key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }).join('&');
        }
        function batchRequest(batch) {
            if (!batch.length) {
                return;
            }
            var b,
                group,
                i,
                sourceLoadScript,
                currReqBase,
                moduleMap,
                l;
            function doRequest() {
                var query = Object.create(currReqBase),
                    packed = buildModulesString(moduleMap);
                query.modules = packed.str;
                query.version = getCombinedVersion(packed.list);
                query = sortQuery(query);
                addScript(sourceLoadScript + '?' + makeQueryString(query));
            }
            batch.sort();
            var reqBase = {
                "lang": "en",
                "skin": "vector"
            };
            var splits = Object.create(null);
            for (b = 0; b < batch.length; b++) {
                var bSource = registry[batch[b]].source,
                    bGroup = registry[batch[b]].group;
                if (!splits[bSource]) {
                    splits[bSource] = Object.create(null);
                }
                if (!splits[bSource][bGroup]) {
                    splits[bSource][bGroup] = [];
                }
                splits[bSource][bGroup].push
                (batch[b]);
            }
            for (var source in splits) {
                sourceLoadScript = sources[source];
                for (group in splits[source]) {
                    var modules = splits[source][group];
                    currReqBase = Object.create(reqBase);
                    if (group === 0 && mw.config.get('wgUserName') !== null) {
                        currReqBase.user = mw.config.get('wgUserName');
                    }
                    var currReqBaseLength = makeQueryString(currReqBase).length + 23;
                    l = currReqBaseLength;
                    moduleMap = Object.create(null);
                    var currReqModules = [];
                    for (i = 0; i < modules.length; i++) {
                        var lastDotIndex = modules[i].lastIndexOf('.'),
                            prefix = modules[i].slice(0, Math.max(0, lastDotIndex)),
                            suffix = modules[i].slice(lastDotIndex + 1),
                            bytesAdded = moduleMap[prefix] ? suffix.length + 3 : modules[i].length + 3;
                        if (currReqModules.length && l + bytesAdded > mw.loader.maxQueryLength) {
                            doRequest();
                            l = currReqBaseLength;
                            moduleMap = Object.create(null);
                            currReqModules = [];
                        }
                        if (!moduleMap[prefix]) {
                            moduleMap[prefix] = [];
                        }
                        l += bytesAdded;
                        moduleMap[prefix].push(suffix);
                        currReqModules.push(modules[i]);
                    }
                    if (currReqModules.length) {
                        doRequest();
                    }
                }
            }
        }
        function asyncEval(implementations, cb) {
            if (!implementations.
            length) {
                return;
            }
            mw.requestIdleCallback(function() {
                try {
                    domEval(implementations.join(';'));
                } catch (err) {
                    cb(err);
                }
            });
        }
        function getModuleKey(module) {
            return module in registry ? (module + '@' + registry[module].version) : null;
        }
        function splitModuleKey(key) {
            var index = key.lastIndexOf('@');
            if (index === -1 || index === 0) {
                return {
                    name: key,
                    version: ''
                };
            }
            return {
                name: key.slice(0, index),
                version: key.slice(index + 1)
            };
        }
        function registerOne(module, version, dependencies, group, source, skip) {
            if (module in registry) {
                throw new Error('module already registered: ' + module);
            }
            version = String(version || '');
            var requiresES6 = version.slice(-1) === '!';
            if (requiresES6) {
                version = version.slice(0, -1);
            }
            registry[module] = {
                module: {
                    exports: {}
                },
                packageExports: {},
                version: version,
                requiresES6: requiresES6,
                dependencies: dependencies || [],
                group: typeof group === 'undefined' ? null : group,
                source: typeof source === 'string' ? source : 'local',
                state: 'registered',
                skip: typeof skip === 'string' ? skip : null
            };
        }
        mw.loader = {
            moduleRegistry: registry,
            maxQueryLength: 5000,
            addStyleTag:
            newStyleTag,
            enqueue: enqueue,
            resolve: resolve,
            work: function() {
                store.init();
                var q = queue.length,
                    storedImplementations = [],
                    storedNames = [],
                    requestNames = [],
                    batch = new StringSet();
                while (q--) {
                    var module = queue[q];
                    if (mw.loader.getState(module) === 'registered' && !batch.has(module)) {
                        registry[module].state = 'loading';
                        batch.add(module);
                        var implementation = store.get(module);
                        if (implementation) {
                            storedImplementations.push(implementation);
                            storedNames.push(module);
                        } else {
                            requestNames.push(module);
                        }
                    }
                }
                queue = [];
                asyncEval(storedImplementations, function(err) {
                    store.stats.failed++;
                    store.clear();
                    mw.trackError('resourceloader.exception', {
                        exception: err,
                        source: 'store-eval'
                    });
                    var failed = storedNames.filter(function(name) {
                        return registry[name].state === 'loading';
                    });
                    batchRequest(failed);
                });
                batchRequest(requestNames);
            },
            addSource: function(ids) {
                for (var id in ids) {
                    if (id in sources) {
                        throw new Error('source already registered: ' + id);
                    }
                    sources[id] = ids[id];
                }
            },
            register: function(modules) {
                if (typeof modules !== 'object') {
                    registerOne.apply(null
                    , arguments);
                    return;
                }
                function resolveIndex(dep) {
                    return typeof dep === 'number' ? modules[dep][0] : dep;
                }
                var i,
                    j,
                    deps;
                for (i = 0; i < modules.length; i++) {
                    deps = modules[i][2];
                    if (deps) {
                        for (j = 0; j < deps.length; j++) {
                            deps[j] = resolveIndex(deps[j]);
                        }
                    }
                    registerOne.apply(null, modules[i]);
                }
            },
            implement: function(module, script, style, messages, templates) {
                var split = splitModuleKey(module),
                    name = split.name,
                    version = split.version;
                if (!(name in registry)) {
                    mw.loader.register(name);
                }
                if (registry[name].script !== undefined) {
                    throw new Error('module already implemented: ' + name);
                }
                if (version) {
                    registry[name].version = version;
                }
                registry[name].script = script || null;
                registry[name].style = style || null;
                registry[name].messages = messages || null;
                registry[name].templates = templates || null;
                if (registry[name].state !== 'error' && registry[name].state !== 'missing') {
                    setAndPropagate(name, 'loaded');
                }
            },
            load: function(modules, type) {
                if (typeof modules === 'string' && /^(https?:)?\/?\//.test(modules)) {
                    if (type === 'text/css') {
                        addLink(modules);
                    } else if (type === 'text/javascript' ||
                    type === undefined) {
                        addScript(modules);
                    } else {
                        throw new Error('Invalid type ' + type);
                    }
                } else {
                    modules = typeof modules === 'string' ? [modules] : modules;
                    enqueue(resolveStubbornly(modules));
                }
            },
            state: function(states) {
                for (var module in states) {
                    if (!(module in registry)) {
                        mw.loader.register(module);
                    }
                    setAndPropagate(module, states[module]);
                }
            },
            getState: function(module) {
                return module in registry ? registry[module].state : null;
            },
            require: function(moduleName) {
                if (mw.loader.getState(moduleName) !== 'ready') {
                    throw new Error('Module "' + moduleName + '" is not loaded');
                }
                return registry[moduleName].module.exports;
            }
        };
        var hasPendingWrites = false;
        function flushWrites() {
            store.prune();
            while (store.queue.length) {
                store.set(store.queue.shift());
            }
            try {
                localStorage.removeItem(store.key);
                var data = JSON.stringify(store);
                localStorage.setItem(store.key, data);
            } catch (e) {
                mw.trackError('resourceloader.exception', {
                    exception: e,
                    source: 'store-localstorage-update'
                });
            }
            hasPendingWrites = false;
        }
        mw.loader.store = store = {
            enabled: null,
            items: {},
            queue: [],
            stats: {
                hits: 0,
                misses: 0,
                expired: 0,
                failed: 0
            },
            toJSON: function() {
                return {
                    items: store.items,
                    vary: store.vary,
                    asOf: Math.ceil(Date.now() / 1e7)
                };
            },
            key: "MediaWikiModuleStore:enwiki",
            vary: "vector:1-3:en",
            init: function() {
                if (this.enabled === null) {
                    this.enabled = false;
                    if (false || /Firefox/.test(navigator.userAgent)) {
                        this.clear();
                    } else {
                        this.load();
                    }
                }
            },
            load: function() {
                try {
                    var raw = localStorage.getItem(this.key);
                    this.enabled = true;
                    var data = JSON.parse(raw);
                    if (data && data.vary === this.vary && data.items && Date.now() < (data.asOf * 1e7) + 259e7) {
                        this.items = data.items;
                    }
                } catch (e) {}
            },
            get: function(module) {
                if (this.enabled) {
                    var key = getModuleKey(module);
                    if (key in this.items) {
                        this.stats.hits++;
                        return this.items[key];
                    }
                    this.stats.misses++;
                }
                return false;
            },
            add: function(module) {
                if (this.enabled) {
                    this.queue.push(module);
                    this.requestUpdate();
                }
            },
            set: function(module) {
                var args,
                    encodedScript,
                    descriptor = registry[module],
                    key = getModuleKey(module);
                if (key in this.items || !descriptor || descriptor.state !== 'ready' || !descriptor.version || descriptor.group === 1 ||
                descriptor.group === 0 || [descriptor.script, descriptor.style, descriptor.messages, descriptor.templates].indexOf(undefined) !== -1) {
                    return;
                }
                try {
                    if (typeof descriptor.script === 'function') {
                        encodedScript = String(descriptor.script);
                    } else if (typeof descriptor.script === 'object' && descriptor.script && !Array.isArray(descriptor.script)) {
                        encodedScript = '{' + 'main:' + JSON.stringify(descriptor.script.main) + ',' + 'files:{' + Object.keys(descriptor.script.files).map(function(file) {
                            var value = descriptor.script.files[file];
                            return JSON.stringify(file) + ':' + (typeof value === 'function' ? value : JSON.stringify(value));
                        }).join(',') + '}}';
                    } else {
                        encodedScript = JSON.stringify(descriptor.script);
                    }
                    args = [JSON.stringify(key), encodedScript, JSON.stringify(descriptor.style), JSON.stringify(descriptor.messages), JSON.stringify(descriptor.templates)];
                } catch (e) {
                    mw.trackError('resourceloader.exception', {
                        exception: e,
                        source: 'store-localstorage-json'
                    });
                    return;
                }
                var src = 'mw.loader.implement(' + args.join(',') + ');';
                if (src.length > 1e5) {
                    return;
                }
                this.items[
                key] = src;
            },
            prune: function() {
                for (var key in this.items) {
                    if (getModuleKey(splitModuleKey(key).name) !== key) {
                        this.stats.expired++;
                        delete this.items[key];
                    }
                }
            },
            clear: function() {
                this.items = {};
                try {
                    localStorage.removeItem(this.key);
                } catch (e) {}
            },
            requestUpdate: function() {
                if (!hasPendingWrites) {
                    hasPendingWrites = true;
                    setTimeout(function() {
                        mw.requestIdleCallback(flushWrites);
                    }, 2000);
                }
            }
        };
    }());
    mw.requestIdleCallbackInternal = function(callback) {
        setTimeout(function() {
            var start = mw.now();
            callback({
                didTimeout: false,
                timeRemaining: function() {
                    return Math.max(0, 50 - (mw.now() - start));
                }
            });
        }, 1);
    };
    mw.requestIdleCallback = window.requestIdleCallback ? window.requestIdleCallback.bind(window) : mw.requestIdleCallbackInternal;
    (function() {
        var queue;
        mw.loader.addSource({
            "local": "/w/load.php",
            "metawiki": "//meta.wikimedia.org/w/load.php"
        });
        mw.loader.register([["site", "d9ueh", [1]], ["site.styles", "rc513", [], 2], ["filepage", "19fyj"], ["user", "s1wiu", [], 0], ["user.styles", "smrj4", [], 0], ["user.options", "1i9g4", [], 1], [
        "mediawiki.skinning.elements", "x381c"], ["mediawiki.skinning.content", "1249q"], ["mediawiki.skinning.interface", "dos3l"], ["jquery.makeCollapsible.styles", "fridi"], ["mediawiki.skinning.content.parsoid", "1yx5v"], ["mediawiki.skinning.content.externallinks", "1calv"], ["jquery", "1vnvf"], ["es6-polyfills", "15avj", [], null, null, "return Array.prototype.find\u0026\u0026Array.prototype.findIndex\u0026\u0026Array.prototype.includes\u0026\u0026typeof Promise==='function'\u0026\u0026Promise.prototype.finally;"], ["fetch-polyfill", "1q1hn", [13], null, null, "return typeof fetch==='function';"], ["mediawiki.base", "1wbxj", [12]], ["jquery.chosen", "1gytp"], ["jquery.client", "1tje2"], ["jquery.color", "qs4nu"], ["jquery.confirmable", "1en9n", [113]], ["jquery.cookie", "1u41n"], ["jquery.form", "186tg"], ["jquery.fullscreen", "18ttp"], ["jquery.highlightText", "t130m", [86]], ["jquery.hoverIntent", "pqqa9"], ["jquery.i18n", "31t4a", [112]], ["jquery.lengthLimit", "qrnp1", [68]], ["jquery.makeCollapsible", "13lft", [9]], ["jquery.spinner",
        "yoa8f", [29]], ["jquery.spinner.styles", "pfek7"], ["jquery.suggestions", "1ykxl", [23]], ["jquery.tablesorter", "ex6te", [32, 114, 86]], ["jquery.tablesorter.styles", "7tdec"], ["jquery.textSelection", "em3yw", [17]], ["jquery.throttle-debounce", "1bymo"], ["jquery.tipsy", "17hg0"], ["jquery.ui", "1iin9"], ["moment", "r6trt", [110, 86]], ["vue", "3awne!"], ["@vue/composition-api", "1s4l3", [38]], ["vuex", "ironm!", [38]], ["wvui", "1ryei", [39]], ["wvui-search", "w257l", [38]], ["mediawiki.template", "6nkqm"], ["mediawiki.template.mustache", "gy30q", [43]], ["mediawiki.apipretty", "qjpf2"], ["mediawiki.api", "1sdt6", [74, 113]], ["mediawiki.content.json", "1n6wr"], ["mediawiki.confirmCloseWindow", "1m54f"], ["mediawiki.debug", "a5lwb", [200]], ["mediawiki.diff", "oztjs"], ["mediawiki.diff.styles", "1jzsw"], ["mediawiki.feedback", "nllne", [901, 208]], ["mediawiki.feedlink", "5bck4"], ["mediawiki.filewarning", "gzqvi", [200, 212]], ["mediawiki.ForeignApi", "17f2l", [320]], ["mediawiki.ForeignApi.core", "15s0r", [83, 46, 196]], ["mediawiki.helplink", "5fs9z"], [
        "mediawiki.hlist", "85ir9"], ["mediawiki.htmlform", "14ka5", [26, 86]], ["mediawiki.htmlform.ooui", "moc8u", [200]], ["mediawiki.htmlform.styles", "bs8yc"], ["mediawiki.htmlform.ooui.styles", "147ib"], ["mediawiki.icon", "17xlm"], ["mediawiki.inspect", "1w7zb", [68, 86]], ["mediawiki.notification", "sjyus", [86, 93]], ["mediawiki.notification.convertmessagebox", "zb0xo", [65]], ["mediawiki.notification.convertmessagebox.styles", "dro1f"], ["mediawiki.String", "1ck84"], ["mediawiki.pager.styles", "f8tup"], ["mediawiki.pager.tablePager", "bexmb"], ["mediawiki.pulsatingdot", "svyap"], ["mediawiki.searchSuggest", "16shg", [30, 46]], ["mediawiki.storage", "1sj4u"], ["mediawiki.Title", "1bqh8", [68, 86]], ["mediawiki.Upload", "3i9e4", [46]], ["mediawiki.ForeignUpload", "14fww", [55, 75]], ["mediawiki.ForeignStructuredUpload", "gsf1n", [76]], ["mediawiki.Upload.Dialog", "k8qbo", [79]], ["mediawiki.Upload.BookletLayout", "154gs", [75, 84, 37, 203, 208, 213, 214]], ["mediawiki.ForeignStructuredUpload.BookletLayout", "gss1b", [77, 79, 117, 179, 173]], ["mediawiki.toc",
        "5oex3", [90]], ["mediawiki.toc.styles", "66iwu"], ["mediawiki.Uri", "1db2k", [86]], ["mediawiki.user", "1ab6a", [46, 90]], ["mediawiki.userSuggest", "1tzu5", [30, 46]], ["mediawiki.util", "h69vf", [17]], ["mediawiki.viewport", "j19gc"], ["mediawiki.checkboxtoggle", "nzeg7"], ["mediawiki.checkboxtoggle.styles", "1esmp"], ["mediawiki.cookie", "alksl", [20]], ["mediawiki.experiments", "8e8ao"], ["mediawiki.editfont.styles", "76g2r"], ["mediawiki.visibleTimeout", "15lds"], ["mediawiki.action.delete", "zjbix", [26, 200]], ["mediawiki.action.edit", "doo1g", [33, 96, 46, 92, 175]], ["mediawiki.action.edit.styles", "17fjz"], ["mediawiki.action.edit.collapsibleFooter", "1jlz7", [27, 63, 73]], ["mediawiki.action.edit.preview", "1mqga", [27, 28, 33, 51, 84, 200]], ["mediawiki.action.history", "xzurp", [27]], ["mediawiki.action.history.styles", "10vu6"], ["mediawiki.action.protect", "nuj27", [26, 200]], ["mediawiki.action.view.metadata", "104m6", [108]], ["mediawiki.action.view.categoryPage.styles", "hkv8s"], ["mediawiki.action.view.postEdit", "1jik4", [113, 65]], [
        "mediawiki.action.view.redirect", "1a3n8", [17]], ["mediawiki.action.view.redirectPage", "1jh9v"], ["mediawiki.action.edit.editWarning", "192id", [33, 48, 113]], ["mediawiki.action.view.filepage", "zhum4"], ["mediawiki.action.styles", "1ux4b"], ["mediawiki.language", "1h2x6", [111]], ["mediawiki.cldr", "1630p", [112]], ["mediawiki.libs.pluralruleparser", "8vy0u"], ["mediawiki.jqueryMsg", "b0ah4", [68, 110, 86, 5]], ["mediawiki.language.months", "1tymc", [110]], ["mediawiki.language.names", "17fso", [110]], ["mediawiki.language.specialCharacters", "cv42u", [110]], ["mediawiki.libs.jpegmeta", "16fc5"], ["mediawiki.page.gallery", "147cy", [34, 119]], ["mediawiki.page.gallery.styles", "1p8qp"], ["mediawiki.page.gallery.slideshow", "1j8et", [46, 203, 222, 224]], ["mediawiki.page.ready", "14bfy", [46]], ["mediawiki.page.watch.ajax", "uhy2y", [46]], ["mediawiki.page.image.pagination", "1poh9", [28, 86]], ["mediawiki.rcfilters.filters.base.styles", "ov2oz"], ["mediawiki.rcfilters.highlightCircles.seenunseen.styles", "1p40u"], [
        "mediawiki.rcfilters.filters.ui", "qbt3p", [27, 83, 84, 170, 209, 216, 218, 219, 220, 222, 223]], ["mediawiki.interface.helpers.styles", "u463m"], ["mediawiki.special", "1075a"], ["mediawiki.special.apisandbox", "t5a4y", [27, 83, 190, 176, 199, 214]], ["mediawiki.special.block", "3z6jo", [59, 173, 189, 180, 190, 187, 214, 216]], ["mediawiki.misc-authed-ooui", "4897z", [60, 170, 175]], ["mediawiki.misc-authed-pref", "1b18i", [5]], ["mediawiki.misc-authed-curate", "1auv8", [19, 28, 46]], ["mediawiki.special.changeslist", "1cy7m"], ["mediawiki.special.changeslist.watchlistexpiry", "dgsac", [128]], ["mediawiki.special.changeslist.enhanced", "1xll3"], ["mediawiki.special.changeslist.legend", "1oetg"], ["mediawiki.special.changeslist.legend.js", "fa4m4", [27, 90]], ["mediawiki.special.contributions", "ua2dg", [27, 113, 173, 199]], ["mediawiki.special.edittags", "1di11", [16, 26]], ["mediawiki.special.import", "5dvpi", [170]], ["mediawiki.special.import.styles.ooui", "1wf62"], ["mediawiki.special.preferences.ooui", "kr0k3", [48, 92, 66, 73, 180, 175]], [
        "mediawiki.special.preferences.styles.ooui", "23awn"], ["mediawiki.special.recentchanges", "1b2m9", [170]], ["mediawiki.special.revisionDelete", "e8jxp", [26]], ["mediawiki.special.search", "1sevh", [192]], ["mediawiki.special.search.commonsInterwikiWidget", "5zvgb", [83, 46]], ["mediawiki.special.search.interwikiwidget.styles", "1jo4l"], ["mediawiki.special.search.styles", "v1ktm"], ["mediawiki.special.unwatchedPages", "ygz13", [46]], ["mediawiki.special.upload", "s2u79", [28, 46, 48, 117, 128, 43]], ["mediawiki.special.userlogin.common.styles", "b44v9"], ["mediawiki.special.userlogin.login.styles", "1bqrv"], ["mediawiki.special.createaccount", "jikon", [46]], ["mediawiki.special.userlogin.signup.styles", "1f2lk"], ["mediawiki.special.userrights", "faiav", [26, 66]], ["mediawiki.special.watchlist", "10dqj", [46, 200, 219]], ["mediawiki.special.version", "5yx4s"], ["mediawiki.legacy.config", "w9dxd"], ["mediawiki.legacy.commonPrint", "1xavq"], ["mediawiki.legacy.shared", "lyggv"], ["mediawiki.ui", "11nj9"], ["mediawiki.ui.checkbox", "16z18"], [
        "mediawiki.ui.radio", "boiui"], ["mediawiki.ui.anchor", "qh0g0"], ["mediawiki.ui.button", "1q25i"], ["mediawiki.ui.input", "21edf"], ["mediawiki.ui.icon", "1mdyk"], ["mediawiki.widgets", "1shuv", [46, 171, 203, 213]], ["mediawiki.widgets.styles", "1kqtv"], ["mediawiki.widgets.AbandonEditDialog", "1qv1d", [208]], ["mediawiki.widgets.DateInputWidget", "1957r", [174, 37, 203, 224]], ["mediawiki.widgets.DateInputWidget.styles", "1bl1e"], ["mediawiki.widgets.visibleLengthLimit", "uj2nl", [26, 200]], ["mediawiki.widgets.datetime", "1h0kn", [86, 200, 219, 223, 224]], ["mediawiki.widgets.expiry", "1xp7z", [176, 37, 203]], ["mediawiki.widgets.CheckMatrixWidget", "bbszi", [200]], ["mediawiki.widgets.CategoryMultiselectWidget", "fr599", [55, 203]], ["mediawiki.widgets.SelectWithInputWidget", "yjlkr", [181, 203]], ["mediawiki.widgets.SelectWithInputWidget.styles", "4wtw6"], ["mediawiki.widgets.SizeFilterWidget", "1ht3s", [183, 203]], ["mediawiki.widgets.SizeFilterWidget.styles", "b3yqn"], ["mediawiki.widgets.MediaSearch", "18dlo", [55, 203]], [
        "mediawiki.widgets.Table", "1vxru", [203]], ["mediawiki.widgets.TagMultiselectWidget", "1mwuq", [203]], ["mediawiki.widgets.UserInputWidget", "1555z", [46, 203]], ["mediawiki.widgets.UsersMultiselectWidget", "1h6xp", [46, 203]], ["mediawiki.widgets.NamespacesMultiselectWidget", "jiviu", [203]], ["mediawiki.widgets.TitlesMultiselectWidget", "593ki", [170]], ["mediawiki.widgets.TagMultiselectWidget.styles", "1hdc9"], ["mediawiki.widgets.SearchInputWidget", "haq07", [72, 170, 219]], ["mediawiki.widgets.SearchInputWidget.styles", "176ja"], ["mediawiki.watchstar.widgets", "ex74u", [199]], ["mediawiki.deflate", "iajpb"], ["oojs", "1ch6v"], ["mediawiki.router", "ajk4o", [198]], ["oojs-router", "3j2x4", [196]], ["oojs-ui", "1gvrd", [206, 203, 208]], ["oojs-ui-core", "1iy82", [110, 196, 202, 201, 210]], ["oojs-ui-core.styles", "1odzx"], ["oojs-ui-core.icons", "ivvfb"], ["oojs-ui-widgets", "46oyh", [200, 205]], ["oojs-ui-widgets.styles", "1yex2"], ["oojs-ui-widgets.icons", "106wk"], ["oojs-ui-toolbars", "3qyle", [200, 207]], ["oojs-ui-toolbars.icons", "1utuk"], [
        "oojs-ui-windows", "omzwm", [200, 209]], ["oojs-ui-windows.icons", "17rb8"], ["oojs-ui.styles.indicators", "lk5mi"], ["oojs-ui.styles.icons-accessibility", "a0l9u"], ["oojs-ui.styles.icons-alerts", "938kh"], ["oojs-ui.styles.icons-content", "1twkc"], ["oojs-ui.styles.icons-editing-advanced", "16ou1"], ["oojs-ui.styles.icons-editing-citation", "1yq4k"], ["oojs-ui.styles.icons-editing-core", "ac123"], ["oojs-ui.styles.icons-editing-list", "1qpag"], ["oojs-ui.styles.icons-editing-styling", "1s99n"], ["oojs-ui.styles.icons-interactions", "2fbta"], ["oojs-ui.styles.icons-layout", "18r92"], ["oojs-ui.styles.icons-location", "1y4lz"], ["oojs-ui.styles.icons-media", "12kzp"], ["oojs-ui.styles.icons-moderation", "missh"], ["oojs-ui.styles.icons-movement", "ev571"], ["oojs-ui.styles.icons-user", "1fnzs"], ["oojs-ui.styles.icons-wikimedia", "3r5ki"], ["skins.vector.user", "1xvcb", [], 0], ["skins.vector.user.styles", "1gxes", [], 0], ["skins.vector.search", "10w9c", [83, 42]], ["skins.vector.styles.legacy", "1g3r7"], ["skins.vector.styles", "fmnoo"],
        ["skins.vector.icons.js", "fu37p"], ["skins.vector.icons", "5h3e1"], ["skins.vector.es6", "1qj5b!", [91, 121, 122, 84, 232]], ["skins.vector.js", "mh88g", [121, 232]], ["skins.vector.legacy.js", "1li6r", [121]], ["skins.monobook.styles", "b5gm4"], ["skins.monobook.scripts", "1qakl", [84, 212]], ["skins.modern", "cg2lq"], ["skins.cologneblue", "zaw21"], ["skins.timeless", "82hc2"], ["skins.timeless.js", "1y8qp"], ["ext.timeline.styles", "poumc"], ["ext.wikihiero", "129wi"], ["ext.wikihiero.special", "djmbz", [244, 28, 200]], ["ext.wikihiero.visualEditor", "d1kzb", [439]], ["ext.charinsert", "4sxcx", [33]], ["ext.charinsert.styles", "ou48j"], ["ext.cite.styles", "1lb4h"], ["ext.cite.style", "yx4l1"], ["ext.cite.visualEditor.core", "f8zrj", [447]], ["ext.cite.visualEditor", "1hs37", [250, 249, 251, 212, 215, 219]], ["ext.cite.ux-enhancements", "11f2g"], ["ext.citeThisPage", "1rb6k"], ["ext.inputBox.styles", "15tb6"], ["ext.pygments", "1u9pi"], ["ext.pygments.linenumbers", "zyy6j"], ["ext.geshi.visualEditor", "16uth", [439]], ["ext.flaggedRevs.basic", "19ygq"], [
        "ext.flaggedRevs.advanced", "13vd6", [86]], ["ext.flaggedRevs.review", "asqny", [84]], ["ext.flaggedRevs.review.styles", "utc35"], ["ext.flaggedRevs.icons", "160c9"], ["ext.categoryTree", "12fll", [46]], ["ext.categoryTree.styles", "1ho9u"], ["ext.spamBlacklist.visualEditor", "ovffn"], ["mediawiki.api.titleblacklist", "6nhct", [46]], ["ext.titleblacklist.visualEditor", "1taqb"], ["mw.PopUpMediaTransform", "340aa", [282, 74, 285]], ["mw.TMHGalleryHook.js", "11rpk"], ["ext.tmh.embedPlayerIframe", "1ybhf", [287, 285]], ["mw.MediaWikiPlayerSupport", "1p0go", [285]], ["mw.MediaWikiPlayer.loader", "scrqo", [287]], ["ext.tmh.video-js", "1xn38"], ["ext.tmh.videojs-ogvjs", "r5nu3", [283, 274]], ["ext.tmh.player", "j8f9a", [282, 279, 74]], ["ext.tmh.player.dialog", "cr12g", [278, 208]], ["ext.tmh.player.inline", "fdl2u", [274, 74]], ["ext.tmh.player.styles", "1fq82"], ["ext.tmh.thumbnail.styles", "hrhb9"], ["ext.tmh.transcodetable", "qysvh", [46, 199]], ["ext.tmh.OgvJsSupport", "1rgvj"], ["ext.tmh.OgvJs", "1tz99", [282]], ["embedPlayerIframeStyle", "mptrn"], [
        "mw.MwEmbedSupport", "432l5", [86]], ["mediawiki.UtilitiesTime", "sobvx"], ["jquery.embedPlayer", "3n73h"], ["mw.EmbedPlayer", "12l6d", [282, 20, 24, 36, 83, 286, 113, 290, 285]], ["mw.EmbedPlayerKplayer", "9brbg"], ["mw.EmbedPlayerNative", "fkawj"], ["mw.EmbedPlayerVLCApp", "iihbe", [83]], ["mw.EmbedPlayerIEWebMPrompt", "k2n9t"], ["mw.EmbedPlayerOgvJs", "183ok", [282, 28]], ["mw.EmbedPlayerImageOverlay", "1ihz4"], ["mw.TimedText", "147im", [115, 288]], ["ext.urlShortener.special", "cyon8", [83, 60, 170, 199]], ["ext.urlShortener.toolbar", "1wlu3", [46]], ["ext.securepoll.htmlform", "9l7jw", [28, 187]], ["ext.securepoll", "7ece9"], ["ext.securepoll.special", "lvyc3"], ["ext.score.visualEditor", "1sole", [302, 439]], ["ext.score.visualEditor.icons", "prg2q"], ["ext.score.popup", "cebyg", [46]], ["ext.score.errors", "s56a4"], ["ext.cirrus.serp", "1vywy", [83, 197]], ["ext.cirrus.explore-similar", "1esx7", [46, 44]], ["ext.nuke.confirm", "1itba", [113]], ["ext.confirmEdit.editPreview.ipwhitelist.styles", "1hytm"], ["ext.confirmEdit.visualEditor", "dqe95", [890]], [
        "ext.confirmEdit.simpleCaptcha", "13qx3"], ["ext.confirmEdit.fancyCaptcha.styles", "10m4r"], ["ext.confirmEdit.fancyCaptcha", "1dz3b", [46]], ["ext.confirmEdit.fancyCaptchaMobile", "1dz3b", [498]], ["ext.centralauth", "1bgnl", [28, 86]], ["ext.centralauth.centralautologin", "1dqfu", [113]], ["ext.centralauth.centralautologin.clearcookie", "1kb7x"], ["ext.centralauth.misc.styles", "157rq"], ["ext.centralauth.globaluserautocomplete", "1ik8f", [30, 46]], ["ext.centralauth.globalrenameuser", "1maty", [86]], ["ext.centralauth.ForeignApi", "1tkmh", [56]], ["ext.widgets.GlobalUserInputWidget", "1bs9f", [46, 203]], ["ext.GlobalUserPage", "ibfm1"], ["ext.apifeatureusage", "ohwd2"], ["ext.dismissableSiteNotice", "1tqui", [20, 86]], ["ext.dismissableSiteNotice.styles", "1psm7"], ["ext.centralNotice.startUp", "2q0nb", [328]], ["ext.centralNotice.geoIP", "spv2q", [20]], ["ext.centralNotice.choiceData", "1wvhg", [332]], ["ext.centralNotice.display", "g2zgt", [327, 330, 605, 83, 73]], ["ext.centralNotice.kvStore", "1xmpo"], [
        "ext.centralNotice.bannerHistoryLogger", "1u8rw", [329]], ["ext.centralNotice.impressionDiet", "ozl6s", [329]], ["ext.centralNotice.largeBannerLimit", "p2grr", [329]], ["ext.centralNotice.legacySupport", "1kh3o", [329]], ["ext.centralNotice.bannerSequence", "q58r6", [329]], ["ext.centralNotice.freegeoipLookup", "1ab6b", [327]], ["ext.centralNotice.impressionEventsSampleRate", "1kg37", [329]], ["ext.centralNotice.cspViolationAlert", "1arm3"], ["ext.wikimediamessages.contactpage.affcomchapthorg", "1ukrj"], ["ext.wikimediamessages.contactpage.affcomusergroup", "168yb"], ["mediawiki.special.block.feedback.request", "yglzq"], ["ext.collection", "ixyps", [344, 36, 110]], ["ext.collection.bookcreator.styles", "72m3g"], ["ext.collection.bookcreator", "macvf", [343, 73, 86]], ["ext.collection.checkLoadFromLocalStorage", "4crv1", [342]], ["ext.collection.suggest", "1wfr5", [344]], ["ext.collection.offline", "1vtnw"], ["ext.collection.bookcreator.messageBox", "1gvrd", [350, 349, 58]], ["ext.collection.bookcreator.messageBox.styles", "1gnkt"], [
        "ext.collection.bookcreator.messageBox.icons", "13065"], ["ext.ElectronPdfService.print.styles", "13dj6"], ["ext.ElectronPdfService.special.styles", "1q6mi"], ["ext.ElectronPdfService.special.selectionImages", "1ixuf"], ["ext.advancedSearch.initialstyles", "1l17o"], ["ext.advancedSearch.styles", "ha9cu"], ["ext.advancedSearch.searchtoken", "1vhat", [], 1], ["ext.advancedSearch.elements", "vci3u", [355, 83, 84, 203, 219, 220]], ["ext.advancedSearch.init", "170rl", [357, 356]], ["ext.advancedSearch.SearchFieldUI", "1h395", [74, 203]], ["ext.abuseFilter", "6lhiu"], ["ext.abuseFilter.edit", "13rna", [28, 33, 46, 48, 203]], ["ext.abuseFilter.tools", "1yw3k", [28, 46]], ["ext.abuseFilter.examine", "1cpd3", [28, 46]], ["ext.abuseFilter.ace", "67phm", [582]], ["ext.abuseFilter.visualEditor", "148wm"], ["pdfhandler.messages", "1n82m"], ["ext.wikiEditor", "rjuu2", [33, 34, 36, 116, 84, 170, 214, 215, 216, 217, 218, 222, 43], 3], ["ext.wikiEditor.styles", "3kdjm", [], 3], ["ext.CodeMirror", "mekuh", [370, 33, 36, 84, 218]], ["ext.CodeMirror.data", "1qalo"], ["ext.CodeMirror.lib",
        "12rli"], ["ext.CodeMirror.addons", "1deze", [371]], ["ext.CodeMirror.mode.mediawiki", "o5sap", [371]], ["ext.CodeMirror.lib.mode.css", "12rkf", [371]], ["ext.CodeMirror.lib.mode.javascript", "kv1z9", [371]], ["ext.CodeMirror.lib.mode.xml", "1n718", [371]], ["ext.CodeMirror.lib.mode.htmlmixed", "12m9d", [374, 375, 376]], ["ext.CodeMirror.lib.mode.clike", "1eahy", [371]], ["ext.CodeMirror.lib.mode.php", "19ek6", [378, 377]], ["ext.CodeMirror.visualEditor.init", "1pesf"], ["ext.CodeMirror.visualEditor", "1fqt4", [439]], ["ext.acw.eventlogging", "1hdo0"], ["ext.acw.landingPageStyles", "14bo5"], ["ext.MassMessage.styles", "yqa78"], ["ext.MassMessage.special.js", "gysrf", [26, 34, 36, 113]], ["ext.MassMessage.content.js", "gn56m", [19, 36, 46]], ["ext.MassMessage.create", "igvel", [36, 60, 113]], ["ext.MassMessage.edit", "1k1lh", [175, 199]], ["ext.betaFeatures", "1dfn3", [17, 200]], ["ext.betaFeatures.styles", "1jlfk"], ["mmv", "rio3b", [18, 22, 34, 35, 83, 396]], ["mmv.ui.ondemandshareddependencies", "qzh6b", [391, 199]], ["mmv.ui.download.pane", "w9t5x", [163, 170,
        392]], ["mmv.ui.reuse.shareembed", "1la1k", [170, 392]], ["mmv.ui.tipsyDialog", "1vjiv", [391]], ["mmv.bootstrap", "1bxeh", [167, 169, 398, 198]], ["mmv.bootstrap.autostart", "1bp9m", [396]], ["mmv.head", "f0dls", [73, 84]], ["ext.popups.icons", "lwmec"], ["ext.popups.images", "1nw86"], ["ext.popups", "j5ccd"], ["ext.popups.main", "asedh", [399, 400, 83, 91, 73, 167, 164, 169, 84]], ["ext.linter.edit", "h2pbf", [33]], ["socket.io", "fcmug"], ["dompurify", "cw5fe"], ["color-picker", "1hxf4"], ["unicodejs", "alrva"], ["papaparse", "5tm70"], ["rangefix", "ekvqx"], ["spark-md5", "1uk2w"], ["ext.visualEditor.supportCheck", "hzrm9", [], 4], ["ext.visualEditor.sanitize", "1snr7", [405, 428], 4], ["ext.visualEditor.progressBarWidget", "1rpgd", [], 4], ["ext.visualEditor.tempWikitextEditorWidget", "151cl", [92, 84], 4], ["ext.visualEditor.desktopArticleTarget.init", "eneav", [413, 411, 414, 425, 33, 83, 121, 73], 4], ["ext.visualEditor.desktopArticleTarget.noscript", "wmadm"], ["ext.visualEditor.targetLoader", "g0jni", [427, 425, 33, 83, 73, 84], 4], ["ext.visualEditor.desktopTarget",
        "e0x78", [], 4], ["ext.visualEditor.desktopArticleTarget", "1tmj5", [431, 436, 418, 441], 4], ["ext.visualEditor.collabTarget", "1paqc", [429, 435, 92, 170, 219, 220], 4], ["ext.visualEditor.collabTarget.desktop", "1s2x9", [420, 436, 418, 441], 4], ["ext.visualEditor.collabTarget.init", "tsnnt", [411, 170, 199], 4], ["ext.visualEditor.collabTarget.init.styles", "18e9s"], ["ext.visualEditor.ve", "1mbx1", [], 4], ["ext.visualEditor.track", "1lfjv", [424], 4], ["ext.visualEditor.core.utils", "9oihy", [425, 199], 4], ["ext.visualEditor.core.utils.parsing", "nbae3", [424], 4], ["ext.visualEditor.base", "1auzr", [426, 427, 407], 4], ["ext.visualEditor.mediawiki", "lfnm6", [428, 417, 31, 632], 4], ["ext.visualEditor.mwsave", "d0o4r", [439, 26, 28, 51, 219], 4], ["ext.visualEditor.articleTarget", "ulxrm", [440, 430, 172], 4], ["ext.visualEditor.data", "1li8v", [429]], ["ext.visualEditor.core", "1cr6h", [412, 411, 17, 408, 409, 410], 4], ["ext.visualEditor.commentAnnotation", "vvma3", [433], 4], ["ext.visualEditor.rebase", "7l1o6", [406, 450, 434, 225, 404], 4], ["ext.visualEditor.core.desktop"
        , "127qa", [433], 4], ["ext.visualEditor.welcome", "k180i", [199], 4], ["ext.visualEditor.switching", "13zga", [46, 199, 211, 214, 216], 4], ["ext.visualEditor.mwcore", "9s15p", [451, 429, 438, 437, 127, 71, 10, 170], 4], ["ext.visualEditor.mwextensions", "1gvrd", [432, 462, 455, 457, 442, 459, 444, 456, 445, 447], 4], ["ext.visualEditor.mwextensions.desktop", "1gvrd", [440, 446, 80], 4], ["ext.visualEditor.mwformatting", "f2yap", [439], 4], ["ext.visualEditor.mwimage.core", "sj5zy", [439], 4], ["ext.visualEditor.mwimage", "1na2d", [443, 184, 37, 222, 226], 4], ["ext.visualEditor.mwlink", "skpv0", [439], 4], ["ext.visualEditor.mwmeta", "abt3a", [445, 106], 4], ["ext.visualEditor.mwtransclusion", "1lrhj", [439, 187], 4], ["treeDiffer", "ylkzm"], ["diffMatchPatch", "1f0tq"], ["ext.visualEditor.checkList", "1vfzu", [433], 4], ["ext.visualEditor.diffing", "sh2xf", [449, 433, 448], 4], ["ext.visualEditor.diffPage.init.styles", "gsa63"], ["ext.visualEditor.diffLoader", "1un0a", [417], 4], ["ext.visualEditor.diffPage.init", "1adaq", [453, 199, 211, 214], 4], ["ext.visualEditor.language",
        "5blra", [433, 632, 115], 4], ["ext.visualEditor.mwlanguage", "1b2id", [433], 4], ["ext.visualEditor.mwalienextension", "1r5rl", [439], 4], ["ext.visualEditor.mwwikitext", "5hwl3", [445, 92], 4], ["ext.visualEditor.mwgallery", "gdvje", [439, 119, 184, 222], 4], ["ext.visualEditor.mwsignature", "put12", [447], 4], ["ext.visualEditor.experimental", "1gvrd", [], 4], ["ext.visualEditor.icons", "1gvrd", [463, 464, 212, 213, 214, 216, 217, 218, 219, 220, 223, 224, 225, 210], 4], ["ext.visualEditor.moduleIcons", "utner"], ["ext.visualEditor.moduleIndicators", "x1ttj"], ["ext.citoid.visualEditor", "eol1g", [252, 466]], ["ext.citoid.visualEditor.data", "1883r", [429]], ["ext.citoid.wikibase.init", "8dvhj"], ["ext.citoid.wikibase", "1fcrm", [467, 36, 199]], ["ext.templateData", "1t2ui"], ["ext.templateDataGenerator.editPage", "1mtwk"], ["ext.templateDataGenerator.data", "p6maa", [196]], ["ext.templateDataGenerator.editTemplatePage", "8vno9", [469, 473, 471, 33, 632, 46, 203, 208, 219, 220, 223]], ["ext.templateData.images", "1mxcy"], ["ext.TemplateWizard", "1ts55", [33, 170, 173, 187, 206,
        208, 219]], ["ext.wikiLove.icon", "sn4hx"], ["ext.wikiLove.startup", "by1r0", [36, 46, 167]], ["ext.wikiLove.local", "1ar7m"], ["ext.wikiLove.init", "1y0df", [476]], ["mediawiki.libs.guiders", "1l1fg"], ["ext.guidedTour.styles", "11m57", [479, 167]], ["ext.guidedTour.lib.internal", "1uwi4", [86]], ["ext.guidedTour.lib", "sbcuo", [605, 481, 480]], ["ext.guidedTour.launcher", "6pn6x"], ["ext.guidedTour", "13bf4", [482]], ["ext.guidedTour.tour.firstedit", "2ma6k", [484]], ["ext.guidedTour.tour.test", "1jpds", [484]], ["ext.guidedTour.tour.onshow", "fgb8d", [484]], ["ext.guidedTour.tour.uprightdownleft", "p83px", [484]], ["mobile.pagelist.styles", "ru5wt"], ["mobile.pagesummary.styles", "92qem"], ["mobile.placeholder.images", "17c67"], ["mobile.userpage.styles", "2lscv"], ["mobile.startup.images", "tcmhw"], ["mobile.init.styles", "apw71"], ["mobile.init", "185mq", [83, 498]], ["mobile.ooui.icons", "11gzg"], ["mobile.user.icons", "qgftl"], ["mobile.startup", "8yk51", [34, 122, 197, 73, 44, 167, 169, 84, 496, 489, 490, 491, 493]], ["mobile.editor.overlay", "4tvlh", [48, 92
        , 65, 168, 172, 500, 498, 497, 199, 216]], ["mobile.editor.images", "3rsrx"], ["mobile.talk.overlays", "o3tom", [166, 499]], ["mobile.mediaViewer", "58kwv", [498]], ["mobile.languages.structured", "1h5ky", [498]], ["mobile.special.mobileoptions.styles", "14wyz"], ["mobile.special.mobileoptions.scripts", "wh13m", [498]], ["mobile.special.nearby.styles", "1i12k"], ["mobile.special.userlogin.scripts", "1rm8n"], ["mobile.special.nearby.scripts", "1ceei", [83, 506, 498]], ["mobile.special.mobilediff.images", "pqcvf"], ["skins.minerva.base.styles", "aw0m8"], ["skins.minerva.content.styles.images", "74rdn"], ["skins.minerva.icons.loggedin", "1a7t4"], ["skins.minerva.amc.styles", "12l8e"], ["skins.minerva.overflow.icons", "3szme"], ["skins.minerva.icons.wikimedia", "pt32s"], ["skins.minerva.icons.images.scripts.misc", "b4jfi"], ["skins.minerva.icons.page.issues.uncolored", "qqhp4"], ["skins.minerva.icons.page.issues.default.color", "5ogt5"], ["skins.minerva.icons.page.issues.medium.color", "s8xmw"], ["skins.minerva.mainPage.styles", "1n58l"], [
        "skins.minerva.userpage.styles", "12tak"], ["skins.minerva.talk.styles", "1w2a4"], ["skins.minerva.personalMenu.icons", "pxp8l"], ["skins.minerva.mainMenu.advanced.icons", "1byc8"], ["skins.minerva.mainMenu.icons", "oulvs"], ["skins.minerva.mainMenu.styles", "1j4vw"], ["skins.minerva.loggedin.styles", "1aaoj"], ["skins.minerva.scripts", "hmly8", [83, 91, 166, 498, 516, 518, 519, 517, 525, 526, 529]], ["skins.minerva.messageBox.styles", "1oz5p"], ["skins.minerva.categories.styles", "1j2ys"], ["ext.math.styles", "1v9c1"], ["ext.math.scripts", "16fem"], ["mw.widgets.MathWbEntitySelector", "amyw4", [55, 170, 773, 208]], ["ext.math.visualEditor", "12uvp", [531, 439]], ["ext.math.visualEditor.mathSymbolsData", "ltjso", [534]], ["ext.math.visualEditor.mathSymbols", "1tj2q", [535]], ["ext.math.visualEditor.chemSymbolsData", "ar9ku", [534]], ["ext.math.visualEditor.chemSymbols", "r7qo8", [537]], ["ext.babel", "16oqx"], ["ext.vipsscaler", "5smlp", [541]], ["jquery.ucompare", "1w08f"], ["mediawiki.template.underscore", "fxmmu", [543, 43]], [
        "ext.pageTriage.external", "1re93"], ["ext.pageTriage.init", "104v5", [543]], ["ext.pageTriage.util", "qpez8", [544, 83, 84]], ["ext.pageTriage.views.list", "148f7", [545, 28, 36, 542]], ["ext.pageTriage.defaultTagsOptions", "1xoej"], ["ext.pageTriage.externalTagsOptions", "uh8ef", [547, 549]], ["ext.pageTriage.defaultDeletionTagsOptions", "tygup", [74]], ["ext.pageTriage.toolbarStartup", "11jji", [544]], ["ext.pageTriage.article", "xliy1", [544, 83, 46]], ["ext.PageTriage.enqueue", "8bnyb", [86]], ["ext.interwiki.specialpage", "pge0w"], ["ext.echo.logger", "18jip", [84, 196]], ["ext.echo.ui.desktop", "1oxve", [561, 556]], ["ext.echo.ui", "oscpk", [557, 554, 887, 203, 212, 213, 219, 223, 224, 225]], ["ext.echo.dm", "116i0", [560, 37]], ["ext.echo.api", "wqab8", [55]], ["ext.echo.mobile", "9c2h5", [556, 197, 44]], ["ext.echo.init", "vju2j", [558]], ["ext.echo.styles.badge", "15h53"], ["ext.echo.styles.notifications", "1u6xa"], ["ext.echo.styles.alert", "14slx"], ["ext.echo.special", "1o9r4", [565, 556]], ["ext.echo.styles.special", "1djtg"], ["ext.thanks.images", "3mcas"
        ], ["ext.thanks", "mqgir", [46, 90]], ["ext.thanks.corethank", "152tn", [567, 19, 208]], ["ext.thanks.mobilediff", "6gg4i", [566, 498]], ["ext.thanks.flowthank", "1q80a", [567, 208]], ["ext.disambiguator", "td418!", [46, 65]], ["ext.disambiguator.visualEditor", "aqsjf", [446]], ["ext.discussionTools.init.styles", "1iex4"], ["ext.discussionTools.init", "7h4ma", [573, 427, 83, 73, 84, 37, 208, 409]], ["ext.discussionTools.debug", "1fn1w", [574]], ["ext.discussionTools.ReplyWidget", "sf2r0", [890, 574, 172, 175, 203]], ["ext.discussionTools.ReplyWidgetPlain", "1c3ip", [576, 438, 92]], ["ext.discussionTools.ReplyWidgetVisual", "1b8gj", [576, 431, 460, 458]], ["ext.codeEditor", "v0khv", [580], 3], ["jquery.codeEditor", "fqf97", [582, 581, 367, 208], 3], ["ext.codeEditor.icons", "1pte3"], ["ext.codeEditor.ace", "1nct8", [], 5], ["ext.codeEditor.ace.modes", "5rdce", [582], 5], ["ext.scribunto.errors", "1k506", [36]], ["ext.scribunto.logs", "kr527"], ["ext.scribunto.edit", "1lvk4", [28, 46]], ["ext.relatedArticles.styles", "18y9m"], ["ext.relatedArticles.cards", "1bpn0", [589, 86, 196]
        ], ["ext.relatedArticles.lib", "1hns8"], ["ext.relatedArticles.readMore.gateway", "1so6y", [196]], ["ext.relatedArticles.readMore.bootstrap", "1cj0t", [590, 83, 91, 84]], ["ext.relatedArticles.readMore", "1srlf", [86]], ["ext.RevisionSlider.lazyCss", "hjlz2"], ["ext.RevisionSlider.lazyJs", "cqh11", [597, 224]], ["ext.RevisionSlider.init", "6ncp4", [597, 598, 223]], ["ext.RevisionSlider.noscript", "1fgu3"], ["ext.RevisionSlider.Settings", "7m4kh", [73, 84]], ["ext.RevisionSlider.Slider", "1patb", [599, 36, 83, 37, 199, 219, 224]], ["ext.RevisionSlider.dialogImages", "s30i0"], ["ext.TwoColConflict.SplitJs", "bndc5", [602, 603, 71, 73, 84, 199, 219]], ["ext.TwoColConflict.SplitCss", "11s8v"], ["ext.TwoColConflict.Split.TourImages", "iolxv"], ["ext.TwoColConflict.Util", "17tmk"], ["ext.TwoColConflict.JSCheck", "1kalq"], ["ext.eventLogging", "1d7q1", [84]], ["ext.eventLogging.debug", "aryjb"], ["ext.eventLogging.jsonSchema", "uo1an"], ["ext.eventLogging.jsonSchema.styles", "rijb8"], ["ext.wikimediaEvents", "1xszt", [605, 83, 91, 73, 93]], [
        "ext.wikimediaEvents.wikibase", "226q5", [605, 91]], ["ext.navigationTiming", "5upd4", [605]], ["ext.uls.common", "ejl24", [632, 73, 84]], ["ext.uls.compactlinks", "178wy", [612, 167]], ["ext.uls.ime", "1xepw", [622, 630]], ["ext.uls.displaysettings", "20z1j", [614, 621, 164, 165]], ["ext.uls.geoclient", "ijzbu", [90]], ["ext.uls.i18n", "37yzm", [25, 86]], ["ext.uls.interface", "j7qfp", [628]], ["ext.uls.interlanguage", "1qjgi"], ["ext.uls.languagenames", "1p3nh"], ["ext.uls.languagesettings", "1crjx", [623, 624, 633, 167]], ["ext.uls.mediawiki", "joiy0", [612, 620, 623, 628, 631]], ["ext.uls.messages", "15kzc", [617]], ["ext.uls.preferences", "w4ber", [73, 84]], ["ext.uls.preferencespage", "39jcv"], ["ext.uls.pt", "v6l4l"], ["ext.uls.setlang", "1907k", [83, 46, 167]], ["ext.uls.webfonts", "yefw5", [624]], ["ext.uls.webfonts.repository", "llohn"], ["jquery.ime", "7gu5h"], ["jquery.uls", "1vkih", [25, 632, 633]], ["jquery.uls.data", "7ouuw"], ["jquery.uls.grid", "cnek2"], ["rangy.core", "1sbtu"], ["ext.cx.contributions", "gltqp", [86, 200, 213, 214]], ["ext.cx.model", "1crl5"], [
        "ext.cx.icons", "1ms5s"], ["ext.cx.dashboard", "636st", [655, 30, 170, 37, 641, 665, 642, 214, 216, 222, 223]], ["sx.publishing.followup", "194q9", [641, 640, 38]], ["mw.cx.util", "11sfj", [636, 84]], ["mw.cx.SiteMapper", "1398w", [636, 55, 84]], ["mw.cx.ui.LanguageFilter", "q28h3", [622, 167, 659, 640, 219]], ["ext.cx.wikibase.link", "kocyg"], ["ext.cx.eventlogging.campaigns", "1ghta", [84]], ["ext.cx.interlanguagelink.init", "1wkfl", [612]], ["ext.cx.interlanguagelink", "15rfd", [612, 641, 203, 219]], ["ext.cx.translation.conflict", "c9ehl", [113]], ["ext.cx.stats", "4xudj", [649, 656, 655, 632, 37, 641]], ["chart.js", "1ww4v"], ["ext.cx.entrypoints.newarticle", "179xy", [656, 167, 86, 200]], ["ext.cx.entrypoints.newarticle.veloader", "1vl89"], ["ext.cx.entrypoints.newbytranslation", "aa810", [641, 640, 203, 213, 219]], ["ext.cx.betafeature.init", "12fk9"], ["ext.cx.entrypoints.contributionsmenu", "14y23", [637, 656, 113, 169]], ["ext.cx.widgets.spinner", "1tvye", [636]], ["ext.cx.widgets.callout", "111lz"], ["mw.cx.dm", "x7cf8", [636, 196]], ["mw.cx.dm.Translation", "1dvt6", [
        657]], ["mw.cx.ui", "gw1gp", [636, 199]], ["mw.cx.visualEditor", "14ep5", [252, 436, 418, 441, 661, 662]], ["ve.ce.CXLintableNode", "fujzh", [433]], ["ve.dm.CXLintableNode", "u20ud", [433, 657]], ["mw.cx.init", "1d0tx", [655, 446, 195, 669, 665, 661, 662, 664]], ["ve.init.mw.CXTarget", "f1pha", [436, 641, 658, 659, 640]], ["mw.cx.ui.Infobar", "69ufl", [659, 640, 212, 219]], ["mw.cx.ui.CaptchaDialog", "qjf1d", [889, 659]], ["mw.cx.ui.LoginDialog", "1nnmd", [86, 659]], ["mw.cx.tools.InstructionsTool", "1h1km", [113, 669, 44]], ["mw.cx.tools.TranslationTool", "qll7p", [659]], ["mw.cx.ui.FeatureDiscoveryWidget", "19cf3", [71, 659]], ["mw.cx.skin", "14147"], ["mw.externalguidance.init", "1jndi", [83]], ["mw.externalguidance", "avkvv", [55, 498, 674, 216]], ["mw.externalguidance.icons", "axtpa"], ["mw.externalguidance.special", "db9en", [632, 55, 165, 498, 674]], ["wikibase.client.init", "1ubuy"], ["wikibase.client.miscStyles", "6yl1g"], ["wikibase.client.linkitem.init", "1vxjj", [28]], ["jquery.wikibase.linkitem", "kw70o", [28, 35, 36, 55, 773, 772, 896]], [
        "wikibase.client.action.edit.collapsibleFooter", "znjul", [27, 63, 73]], ["ext.wikimediaBadges", "19qhw"], ["ext.TemplateSandbox.top", "1lfwo"], ["ext.TemplateSandbox", "16kj6", [682]], ["ext.TemplateSandbox.visualeditor", "28oum", [170, 199]], ["ext.pageassessments.special", "17qq5", [30, 200]], ["ext.jsonConfig", "1i3ek"], ["ext.jsonConfig.edit", "t0qa8", [33, 185, 208]], ["ext.graph.styles", "1nsv7"], ["ext.graph.data", "lnpu6"], ["ext.graph.loader", "1rnlv", [46]], ["ext.graph.vega1", "8dzub", [689, 83]], ["ext.graph.vega2", "a8el9", [689, 83]], ["ext.graph.sandbox", "e2bnd", [579, 692, 48]], ["ext.graph.visualEditor", "1072e", [689, 443, 185]], ["ext.MWOAuth.styles", "mma12"], ["ext.MWOAuth.AuthorizeDialog", "5xi0x", [36]], ["ext.oath.totp.showqrcode", "b22bu"], ["ext.oath.totp.showqrcode.styles", "5iqin"], ["ext.webauthn.ui.base", "aquki", [113, 199]], ["ext.webauthn.register", "cvoxt", [699, 46]], ["ext.webauthn.login", "9wo3z", [699]], ["ext.webauthn.manage", "16wxd", [699, 46]], ["ext.webauthn.disable", "1rdca", [699]], ["ext.ores.highlighter", "5907c"], [
        "ext.ores.styles", "1ltne"], ["ext.ores.api", "1d8oi"], ["ext.checkUser", "1xcbk", [31, 83, 69, 73, 170, 214, 216, 219, 221, 223, 225]], ["ext.checkUser.styles", "t3f9h"], ["ext.guidedTour.tour.checkuserinvestigateform", "15adu", [484]], ["ext.guidedTour.tour.checkuserinvestigate", "12w9i", [707, 484]], ["ext.quicksurveys.lib", "8zwno", [605, 28, 83, 91, 73]], ["ext.quicksurveys.lib.vue", "1ljdx", [711, 41]], ["ext.quicksurveys.init", "7d3rt"], ["ext.kartographer", "h1jlj"], ["ext.kartographer.style", "kg9oi"], ["ext.kartographer.site", "1n5nk"], ["mapbox", "1spcu"], ["leaflet.draw", "997vt", [717]], ["ext.kartographer.link", "wd8as", [721, 197]], ["ext.kartographer.box", "zokn0", [722, 733, 716, 715, 725, 83, 46, 222]], ["ext.kartographer.linkbox", "1ijfh", [725]], ["ext.kartographer.data", "1jj2n"], ["ext.kartographer.dialog", "gscu7", [717, 197, 203, 208, 219]], ["ext.kartographer.dialog.sidebar", "14t0l", [73, 219, 224]], ["ext.kartographer.util", "1d9jl", [714]], ["ext.kartographer.frame", "zg7jg", [720, 197]], ["ext.kartographer.staticframe", "1n23r", [721, 197, 222]], [
        "ext.kartographer.preview", "y6o47"], ["ext.kartographer.editing", "1oqrk", [46]], ["ext.kartographer.editor", "1gvrd", [720, 718]], ["ext.kartographer.visualEditor", "75vxo", [725, 439, 221]], ["ext.kartographer.lib.prunecluster", "1mdne", [717]], ["ext.kartographer.lib.topojson", "1em2u", [717]], ["ext.kartographer.wv", "1m2sk", [732, 216]], ["ext.kartographer.specialMap", "19ibl"], ["ext.pageviewinfo", "9mu3h", [692, 199]], ["three.js", "5cwh3"], ["ext.3d", "1qcqu", [28]], ["ext.3d.styles", "1p924"], ["mmv.3d", "1qed8", [738, 391, 737]], ["mmv.3d.head", "y7cpb", [738, 200, 211, 213]], ["ext.3d.special.upload", "b1fz9", [743, 152]], ["ext.3d.special.upload.styles", "u2y0d"], ["ext.GlobalPreferences.global", "95i41", [170, 178, 188]], ["ext.GlobalPreferences.global-nojs", "f4960"], ["ext.GlobalPreferences.local-nojs", "lra5j"], ["ext.growthExperiments.mobileMenu.icons", "1yalm"], ["ext.growthExperiments.SuggestedEditSession", "pbgfd", [83, 73, 84, 196]], ["ext.growthExperiments.Homepage.ConfirmEmailNotice", "r969g"], [
        "ext.growthExperiments.HomepageDiscovery.styles", "1p2jy"], ["ext.growthExperiments.HelpPanelCta.styles", "e2qi2"], ["ext.growthExperiments.Homepage.Logger", "biln3", [84, 200]], ["ext.growthExperiments.Homepage.Logging", "h7xnj", [752, 83]], ["ext.growthExperiments.Homepage.RecentQuestions", "waxy1", [46]], ["ext.growthExperiments.Homepage.Impact", "1kt8c", [752, 208]], ["ext.growthExperiments.Homepage.Mentorship", "1yljy", [761, 748, 197]], ["ext.growthExperiments.Homepage.SuggestedEdits", "yp70v", [752, 748, 71, 197, 203, 208, 213, 216, 222]], ["ext.growthExperiments.StructuredTask", "1gxzy", [760, 768, 445, 197, 222, 223, 224]], ["ext.growthExperiments.StructuredTask.desktop", "ow1dc", [758, 419]], ["ext.growthExperiments.StructuredTask.PreEdit", "45do8", [748, 203, 208]], ["ext.growthExperiments.Help", "os43s", [768, 83, 73, 84, 203, 208, 212, 214, 215, 216, 219, 225]], ["ext.growthExperiments.HelpPanel", "1d9gp", [761, 751, 760, 71, 224]], ["ext.growthExperiments.HelpPanel.init", "1nbnx", [748]], ["ext.growthExperiments.PostEdit", "14st1", [748, 768, 208, 222]
        ], ["ext.growthExperiments.Homepage.styles", "wzd12"], ["ext.growthExperiments.Account", "1ub2s", [197, 203]], ["ext.growthExperiments.Account.styles", "1qagh"], ["ext.growthExperiments.icons", "1o45u"], ["ext.growthExperiments.MentorDashboard", "hhtjs", [768, 187, 208, 215, 216, 219, 222, 223, 224, 225]], ["ext.growthExperiments.MentorDashboard.styles", "hy5kl"], ["ext.growthExperiments.MentorDashboard.Discovery", "1xtyr", [71]], ["mw.config.values.wbSiteDetails", "15eit"], ["mw.config.values.wbRepo", "18lj4"], ["ext.centralauth.globalrenamequeue", "18igp"], ["ext.centralauth.globalrenamequeue.styles", "z2t5w"], ["ext.gadget.modrollback", "1hrx0", [], 2], ["ext.gadget.confirmationRollback-mobile", "kvyxb", [86], 2], ["ext.gadget.removeAccessKeys", "557l8", [3, 86], 2], ["ext.gadget.searchFocus", "1mmer", [], 2], ["ext.gadget.GoogleTrans", "17ve5", [], 2], ["ext.gadget.ImageAnnotator", "1r3y9", [], 2], ["ext.gadget.imagelinks", "7wsh2", [86], 2], ["ext.gadget.Navigation_popups", "j51q0", [84], 2], ["ext.gadget.exlinks", "n4i46", [86], 2], [
        "ext.gadget.search-new-tab", "eyn89", [], 2], ["ext.gadget.PrintOptions", "1vvec", [], 2], ["ext.gadget.revisionjumper", "12cnv", [], 2], ["ext.gadget.Twinkle", "12m5w", [789, 791], 2], ["ext.gadget.morebits", "d0bt0", [84, 36], 2], ["ext.gadget.Twinkle-pagestyles", "1m55z", [], 2], ["ext.gadget.select2", "tyl13", [], 2], ["ext.gadget.HideCentralNotice", "vi68x", [], 2], ["ext.gadget.ReferenceTooltips", "142a5", [90, 17], 2], ["ext.gadget.formWizard", "1c4rn", [], 2], ["ext.gadget.formWizard-core", "18bbr", [163, 84, 16, 36], 2], ["ext.gadget.responsiveContentBase", "1mfam", [], 2], ["ext.gadget.responsiveContentBaseTimeless", "wd4t1", [], 2], ["ext.gadget.Prosesize", "5xjv4", [46], 2], ["ext.gadget.find-archived-section", "12a8s", [], 2], ["ext.gadget.geonotice", "1ra3v", [], 2], ["ext.gadget.geonotice-core", "7s5bb", [86, 73], 2], ["ext.gadget.watchlist-notice", "1p7rl", [], 2], ["ext.gadget.watchlist-notice-core", "kw8z6", [73], 2], ["ext.gadget.WatchlistBase", "1ner9", [], 2], ["ext.gadget.WatchlistGreenIndicators", "19l1n", [], 2], [
        "ext.gadget.WatchlistGreenIndicatorsMono", "8wkc1", [], 2], ["ext.gadget.WatchlistChangesBold", "1br3c", [], 2], ["ext.gadget.SubtleUpdatemarker", "10yim", [], 2], ["ext.gadget.defaultsummaries", "2owfc", [200], 2], ["ext.gadget.citations", "sl711", [86], 2], ["ext.gadget.DotsSyntaxHighlighter", "1b0il", [], 2], ["ext.gadget.HotCat", "1tzdb", [], 2], ["ext.gadget.wikEdDiff", "yiiyf", [], 2], ["ext.gadget.ProveIt", "13blj", [], 2], ["ext.gadget.ProveIt-classic", "1mrtw", [36, 33, 86], 2], ["ext.gadget.Shortdesc-helper", "1vlpp", [46, 818], 2], ["ext.gadget.Shortdesc-helper-pagestyles-vector", "dkvyf", [], 2], ["ext.gadget.libSettings", "1rh90", [5], 2], ["ext.gadget.wikEd", "zk0go", [33, 5], 2], ["ext.gadget.afchelper", "13wog", [84, 16, 28, 36], 2], ["ext.gadget.charinsert", "170or", [], 2], ["ext.gadget.charinsert-core", "1r7yk", [33, 3, 73], 2], ["ext.gadget.legacyToolbar", "1qg8a", [], 2], ["ext.gadget.extra-toolbar-buttons", "rb1pn", [], 2], ["ext.gadget.extra-toolbar-buttons-core", "xdjek", [], 2], ["ext.gadget.refToolbar", "13mzx", [5, 86], 2], [
        "ext.gadget.refToolbarBase", "fyjt0", [], 2], ["ext.gadget.edittop", "129cq", [5, 86], 2], ["ext.gadget.UTCLiveClock", "1o5mi", [46], 2], ["ext.gadget.UTCLiveClock-pagestyles", "jakir", [], 2], ["ext.gadget.purgetab", "jzey0", [46], 2], ["ext.gadget.ExternalSearch", "12kck", [], 2], ["ext.gadget.CollapsibleNav", "srkhg", [27, 73], 2], ["ext.gadget.MenuTabsToggle", "h6v3y", [90], 2], ["ext.gadget.dropdown-menus", "1cogw", [46], 2], ["ext.gadget.dropdown-menus-pagestyles", "17xqr", [], 2], ["ext.gadget.CategoryAboveAll", "1nwcm", [], 2], ["ext.gadget.addsection-plus", "16rrj", [], 2], ["ext.gadget.CommentsInLocalTime", "1taaq", [], 2], ["ext.gadget.OldDiff", "1dy62", [], 2], ["ext.gadget.NoAnimations", "kc90q", [], 2], ["ext.gadget.disablesuggestions", "28ndd", [], 2], ["ext.gadget.NoSmallFonts", "1gyxy", [], 2], ["ext.gadget.topalert", "1hrrq", [], 2], ["ext.gadget.metadata", "1ek5a", [86], 2], ["ext.gadget.JustifyParagraphs", "lydro", [], 2], ["ext.gadget.righteditlinks", "m3iv6", [], 2], ["ext.gadget.PrettyLog", "1bhey", [86], 2], ["ext.gadget.switcher", "1fn98", [], 2], [
        "ext.gadget.SidebarTranslate", "1vklz", [], 2], ["ext.gadget.Blackskin", "1asze", [], 2], ["ext.gadget.dark-mode-toggle", "1dm0l", [46, 83, 73, 13], 2], ["ext.gadget.dark-mode-toggle-pagestyles", "ru3zh", [], 2], ["ext.gadget.VectorClassic", "9g1z8", [], 2], ["ext.gadget.widensearch", "2v0un", [], 2], ["ext.gadget.DisambiguationLinks", "kx7vk", [], 2], ["ext.gadget.markblocked", "1liah", [121], 2], ["ext.gadget.responsiveContent", "1dfts", [], 2], ["ext.gadget.responsiveContentTimeless", "1utod", [], 2], ["ext.gadget.HideInterwikiSearchResults", "1whqi", [], 2], ["ext.gadget.XTools-ArticleInfo", "1fp9k", [], 2], ["ext.gadget.RegexMenuFramework", "kx4ig", [], 2], ["ext.gadget.ShowMessageNames", "zyxv5", [86], 2], ["ext.gadget.DebugMode", "1p7ok", [86], 2], ["ext.gadget.contribsrange", "1py64", [86, 28], 2], ["ext.gadget.BugStatusUpdate", "hpahb", [], 2], ["ext.gadget.RTRC", "uiwiz", [], 2], ["ext.gadget.script-installer", "hsz58", [167], 2], ["ext.gadget.XFDcloser", "1i7wb", [84], 2], ["ext.gadget.XFDcloser-core", "ewrez", [46, 203, 208, 219, 213, 223, 212], 2], [
        "ext.gadget.XFDcloser-core-beta", "ztfcr", [46, 203, 208, 219, 213, 223, 212], 2], ["ext.gadget.libExtraUtil", "gbhwu", [], 2], ["ext.gadget.mobile-sidebar", "6op37", [], 2], ["ext.gadget.addMe", "1t6z9", [], 2], ["ext.gadget.NewImageThumb", "rpbhf", [], 2], ["ext.gadget.StickyTableHeaders", "49eh1", [], 2], ["ext.gadget.ShowJavascriptErrors", "ljtx8", [], 2], ["ext.gadget.PageDescriptions", "o0m55", [46], 2], ["ext.gadget.autonum", "19g7x", [], 2], ["ext.gadget.libLua", "1jjrv", [46], 2], ["ext.gadget.libSensitiveIPs", "uy6dv", [880], 2], ["ext.gadget.dark-mode", "1dzwh", [], 2], ["ext.gadget.HideFundraisingNotice", "190t0", [], 2], ["ext.guidedTour.tour.firsteditve", "muzw7", [484]], ["ext.pageTriage.views.toolbar", "aihq2", [548, 545, 478, 28, 901, 212, 542]], ["ext.echo.emailicons", "k41gx"], ["ext.echo.secondaryicons", "3m59c"], ["ext.wikimediaEvents.visualEditor", "7jlvn", [417]], ["mw.cx.externalmessages", "r1moo"], ["ext.confirmEdit.CaptchaInputWidget", "1qawk", [200]], ["ext.globalCssJs.user", "1son6", [], 0, "metawiki"], ["ext.globalCssJs.user.styles", "1son6", [
        ], 0, "metawiki"], ["ext.guidedTour.tour.RcFiltersIntro", "j668k", [484]], ["ext.guidedTour.tour.WlFiltersIntro", "x6o7i", [484]], ["ext.guidedTour.tour.RcFiltersHighlight", "1xgce", [484]], ["wikibase.Site", "78xgv", [622]], ["ext.guidedTour.tour.helppanel", "150wn", [484]], ["ext.guidedTour.tour.homepage_mentor", "d07n2", [484]], ["ext.guidedTour.tour.homepage_welcome", "17t0z", [484]], ["ext.guidedTour.tour.homepage_discovery", "odx97", [484]], ["mediawiki.messagePoster", "gdbf7", [55]]]);
        mw.config.set(window.RLCONF || {});
        mw.loader.state(window.RLSTATE || {});
        mw.loader.load(window.RLPAGEMODULES || []);
        queue = window.RLQ || [];
        RLQ = [];
        RLQ.push = function(fn) {
            if (typeof fn === 'function') {
                fn();
            } else {
                RLQ[RLQ.length] = fn;
            }
        };
        while (queue[0]) {
            RLQ.push(queue.shift());
        }
        NORLQ = {
            push: function() {}
        };
    }());
}

