// ==========================================
// LUDO GAME - CLEAN GAME ENGINE
// ==========================================

// ------------------------------------------
// DOM ELEMENTS
// ------------------------------------------

const board = document.getElementById("board");
const diceElement = document.getElementById("dice");
const rollButton = document.getElementById("rollButton");
const resetButton = document.getElementById("resetButton");
const turnText = document.getElementById("turnText");
const resultText = document.getElementById("result");

// ------------------------------------------
// GAME STATE
// ------------------------------------------

let currentPlayer = 0;
let diceValue = null;

let phase = "ROLL";
// ROLL     = waiting for dice
// SELECT   = player must select token
// MOVING   = token is moving
// GAMEOVER = game finished

let consecutiveSixes = 0;
let gameOver = false;

let tokens = [];

// ------------------------------------------
// PLAYERS
// ------------------------------------------

const players = [
    {
        name: "Red",
        color: "red",
        emoji: "🔴",

        // Red entry/start
        start: 0,

        lane: [
            [7, 1],
            [7, 2],
            [7, 3],
            [7, 4],
            [7, 5]
        ],

        homeSelector: ".red-home"
    },

    {
        name: "Green",
        color: "green",
        emoji: "🟢",

        // Green entry/start
        start: 13,

        lane: [
            [1, 7],
            [2, 7],
            [3, 7],
            [4, 7],
            [5, 7]
        ],

        homeSelector: ".green-home"
    },

    {
        name: "Yellow",
        color: "yellow",
        emoji: "🟡",

        // Yellow entry/start
        start: 39,

        lane: [
            [13, 7],
            [12, 7],
            [11, 7],
            [10, 7],
            [9, 7]
        ],

        homeSelector: ".yellow-home"
    },

    {
        name: "Blue",
        color: "blue",
        emoji: "🔵",

        // Blue entry/start
        start: 26,

        lane: [
            [7, 13],
            [7, 12],
            [7, 11],
            [7, 10],
            [7, 9]
        ],

        homeSelector: ".blue-home"
    }
];

// ------------------------------------------
// OUTER TRACK - 52 CELLS
// ------------------------------------------

const track = [
    [6, 0],
    [6, 1],
    [6, 2],
    [6, 3],
    [6, 4],
    [6, 5],

    [5, 6],
    [4, 6],
    [3, 6],
    [2, 6],
    [1, 6],
    [0, 6],

    [0, 7],
    [0, 8],

    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],

    [6, 9],
    [6, 10],
    [6, 11],
    [6, 12],
    [6, 13],
    [6, 14],

    [7, 14],

    [8, 14],
    [8, 13],
    [8, 12],
    [8, 11],
    [8, 10],
    [8, 9],

    [9, 8],
    [10, 8],
    [11, 8],
    [12, 8],
    [13, 8],
    [14, 8],

    [14, 7],
    [14, 6],

    [13, 6],
    [12, 6],
    [11, 6],
    [10, 6],
    [9, 6],

    [8, 5],
    [8, 4],
    [8, 3],
    [8, 2],
    [8, 1],
    [8, 0],

    [7, 0]
];

// ------------------------------------------
// SAFE CELLS
// ------------------------------------------
//
// These are the normal safe/star squares.
// The starting squares are protected separately.
//

const safeCells = new Set([
    0,
    8,
    13,
    21,
    26,
    34,
    39,
    47
]);

// ------------------------------------------
// CREATE TOKENS
// ------------------------------------------

function createTokens() {

    tokens = [];

    players.forEach((player, playerIndex) => {

        for (let i = 0; i < 4; i++) {

            tokens.push({
                id: `${player.color}-${i}`,
                playerIndex: playerIndex,
                color: player.color,
                number: i + 1,

                // -1 = home
                // 0 = starting square
                // 1-51 = outer track
                // 52-56 = finishing lane
                // 57 = finished
                position: -1
            });
        }
    });
}

// ------------------------------------------
// CREATE BOARD
// ------------------------------------------

function createBoard() {

    board
        .querySelectorAll(".board-cell")
        .forEach(cell => cell.remove());

    board
        .querySelectorAll(".board-token")
        .forEach(token => token.remove());

    for (let row = 0; row < 15; row++) {

        for (let col = 0; col < 15; col++) {

            const cell = document.createElement("div");

            cell.className = "board-cell";

            cell.dataset.row = row;
            cell.dataset.col = col;

            // Needed so multiple tokens can be positioned
            // independently inside the same square.
            cell.style.position = "relative";

            addLaneClass(cell, row, col);

            const trackIndex =
                getTrackIndex(row, col);

            if (
                trackIndex !== -1 &&
                safeCells.has(trackIndex)
            ) {

                cell.classList.add("safe-cell");
                cell.textContent = "★";
            }

            // Starting squares
            players.forEach(player => {

                const startCoordinate =
                    getStartingCoordinate(player);

                if (
                    startCoordinate[0] === row &&
                    startCoordinate[1] === col
                ) {

                    cell.classList.add(
                        `${player.color}-start-cell`
                    );
                }
            });

            board.appendChild(cell);
        }
    }
}

// ------------------------------------------
// GET STARTING COORDINATE
// ------------------------------------------

function getStartingCoordinate(player) {

    const index = player.start;

    return track[index];
}

// ------------------------------------------
// ADD LANE CLASS
// ------------------------------------------

function addLaneClass(cell, row, col) {

    players.forEach(player => {

        player.lane.forEach(laneCell => {

            if (
                laneCell[0] === row &&
                laneCell[1] === col
            ) {

                cell.classList.add(
                    `${player.color}-lane`
                );
            }
        });
    });
}

// ------------------------------------------
// FIND TRACK INDEX
// ------------------------------------------

function getTrackIndex(row, col) {

    for (let i = 0; i < track.length; i++) {

        if (
            track[i][0] === row &&
            track[i][1] === col
        ) {

            return i;
        }
    }

    return -1;
}

// ------------------------------------------
// GET TOKEN COORDINATE
// ------------------------------------------

function getTokenCoordinate(token) {

    const player =
        players[token.playerIndex];

    // Token in home
    if (token.position === -1) {
        return null;
    }

    // Starting position
    if (token.position === 0) {
        return track[player.start];
    }

    // Outer track
    if (
        token.position >= 1 &&
        token.position <= 51
    ) {

        const trackIndex =
            (player.start + token.position) % 52;

        return track[trackIndex];
    }

    // Private finishing lane
    if (
        token.position >= 52 &&
        token.position <= 56
    ) {

        const laneIndex =
            token.position - 52;

        return player.lane[laneIndex];
    }

    // Finished
    return null;
}

// ------------------------------------------
// CREATE TOKEN ELEMENT
// ------------------------------------------

function createTokenElement(token) {

    const element =
        document.createElement("button");

    element.type = "button";

    element.className =
        `board-token token-${token.color}`;

    element.textContent =
        token.number;

    element.dataset.tokenId =
        token.id;

    // --------------------------------------
    // SELECTABLE TOKEN
    // --------------------------------------

    if (
        phase === "SELECT" &&
        token.playerIndex === currentPlayer &&
        canTokenMove(token, diceValue)
    ) {

        element.classList.add("movable");

        element.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                moveToken(token);
            }
        );
    }

    return element;
}

// ------------------------------------------
// POSITION MULTIPLE TOKENS IN SAME CELL
// ------------------------------------------
//
// This fixes the problem where two tokens
// occupy the same square and one hides the
// other.
//

function positionTokensInCell(cell) {

    const tokenElements =
        Array.from(
            cell.querySelectorAll(".board-token")
        );

    const count =
        tokenElements.length;

    if (count <= 1) {
        return;
    }

    tokenElements.forEach((element, index) => {

        element.style.position = "absolute";

        const offsets = [
            { x: 25, y: 25 },
            { x: 65, y: 25 },
            { x: 25, y: 65 },
            { x: 65, y: 65 }
        ];

        const offset =
            offsets[index] || offsets[0];

        element.style.left =
            `${offset.x}%`;

        element.style.top =
            `${offset.y}%`;

        element.style.transform =
            "translate(-50%, -50%)";

        element.style.zIndex =
            String(20 + index);
    });
}

// ------------------------------------------
// RENDER TOKENS
// ------------------------------------------

function renderTokens() {

    // Remove board tokens
    board
        .querySelectorAll(".board-token")
        .forEach(token => token.remove());

    // Clear home areas
    document
        .querySelectorAll(".home-token-area")
        .forEach(area => {
            area.innerHTML = "";
        });

    // Clear finish area
    const finishArea =
        document.querySelector(".finish-token-area");

    if (finishArea) {
        finishArea.innerHTML = "";
    }

    // --------------------------------------
    // HOME TOKENS
    // --------------------------------------

    tokens.forEach(token => {

        if (token.position !== -1) {
            return;
        }

        const player =
            players[token.playerIndex];

        const home =
            document.querySelector(
                player.homeSelector
            );

        if (!home) {
            return;
        }

        const homeArea =
            home.querySelector(".home-token-area");

        if (!homeArea) {
            return;
        }

        const element =
            createTokenElement(token);

        homeArea.appendChild(element);
    });

    // --------------------------------------
    // BOARD TOKENS
    // --------------------------------------

    tokens.forEach(token => {

        if (
            token.position === -1 ||
            token.position === 57
        ) {
            return;
        }

        const coordinate =
            getTokenCoordinate(token);

        if (!coordinate) {
            return;
        }

        const cell =
            document.querySelector(
                `.board-cell[data-row="${coordinate[0]}"][data-col="${coordinate[1]}"]`
            );

        if (!cell) {
            return;
        }

        const element =
            createTokenElement(token);

        cell.appendChild(element);
    });

    // --------------------------------------
    // FINISHED TOKENS
    // --------------------------------------

    tokens.forEach(token => {

        if (token.position !== 57) {
            return;
        }

        if (!finishArea) {
            return;
        }

        finishArea.appendChild(
            createTokenElement(token)
        );
    });

    // --------------------------------------
    // FIX STACKED TOKENS
    // --------------------------------------

    document
        .querySelectorAll(".board-cell")
        .forEach(cell => {

            positionTokensInCell(cell);
        });
}

// ------------------------------------------
// CAN TOKEN MOVE?
// ------------------------------------------

function canTokenMove(token, roll) {

    if (
        !Number.isInteger(roll) ||
        roll < 1 ||
        roll > 6
    ) {
        return false;
    }

    // Finished token
    if (token.position === 57) {
        return false;
    }

    // --------------------------------------
    // HOME
    // --------------------------------------
    //
    // A token in home needs a 6.
    //

    if (token.position === -1) {
        return roll === 6;
    }

    // --------------------------------------
    // TOKEN ALREADY ON BOARD
    // --------------------------------------
    //
    // 1,2,3,4,5,6 can all move it.
    //

    if (
        token.position >= 0 &&
        token.position <= 56
    ) {

        return (
            token.position + roll <= 57
        );
    }

    return false;
}

// ------------------------------------------
// GET MOVABLE TOKENS
// ------------------------------------------

function getMovableTokens() {

    return tokens.filter(token => {

        return (
            token.playerIndex === currentPlayer &&
            canTokenMove(token, diceValue)
        );
    });
}

// ------------------------------------------
// UPDATE ROLL BUTTON
// ------------------------------------------

function updateRollButton() {

    if (gameOver) {
        rollButton.disabled = true;
        return;
    }

    rollButton.disabled =
        phase !== "ROLL";
}

// ------------------------------------------
// ROLL DICE
// ------------------------------------------

function rollDice() {

    // Absolutely no second roll during
    // selection or movement.
    if (
        gameOver ||
        phase !== "ROLL"
    ) {
        return;
    }

    diceValue =
        Math.floor(Math.random() * 6) + 1;

    diceElement.textContent =
        getDiceFace(diceValue);

    const player =
        players[currentPlayer];

    resultText.textContent =
        `${player.name} rolled ${diceValue}.`;

    // Lock dice immediately.
    phase = "MOVING";

    updateRollButton();

    // --------------------------------------
    // THREE SIXES
    // --------------------------------------

    if (diceValue === 6) {

        consecutiveSixes++;

    } else {

        consecutiveSixes = 0;
    }

    if (consecutiveSixes >= 3) {

        resultText.textContent =
            `${player.name} rolled three 6s. Turn lost.`;

        diceValue = null;

        consecutiveSixes = 0;

        phase = "ROLL";

        updateRollButton();

        nextPlayer();

        return;
    }

    // --------------------------------------
    // FIND LEGAL TOKENS
    // --------------------------------------

    const movableTokens =
        getMovableTokens();

    // --------------------------------------
    // NO LEGAL MOVE
    // --------------------------------------

    if (movableTokens.length === 0) {

        const wasSix =
            diceValue === 6;

        diceValue = null;

        if (wasSix) {

            // A six still grants another turn,
            // even if no token could move.
            resultText.textContent =
                `${player.name} rolled a 6. Roll again!`;

            phase = "ROLL";

            updateRollButton();

        } else {

            // 1-5 with no possible move:
            // turn ALWAYS changes.
            resultText.textContent =
                `${player.name} has no possible move.`;

            phase = "ROLL";

            updateRollButton();

            nextPlayer();
        }

        return;
    }

    // --------------------------------------
    // EXACTLY ONE TOKEN
    // --------------------------------------

    if (movableTokens.length === 1) {

        const token =
            movableTokens[0];

        resultText.textContent =
            `${player.name} has one possible move. Moving automatically...`;

        setTimeout(() => {

            // Prevent an old timer from
            // moving a token after reset.
            if (phase !== "MOVING") {
                return;
            }

            moveToken(token);

        }, 350);

        return;
    }

    // --------------------------------------
    // TWO OR MORE TOKENS
    // --------------------------------------

    phase = "SELECT";

    resultText.textContent =
        `${player.name}: choose the token you want to move.`;

    updateRollButton();

    renderTokens();
}

// ------------------------------------------
// MOVE TOKEN
// ------------------------------------------

function moveToken(token) {

    // --------------------------------------
    // SAFETY CHECKS
    // --------------------------------------

    if (gameOver) {
        return;
    }

    if (phase !== "SELECT" && phase !== "MOVING") {
        return;
    }

    if (token.playerIndex !== currentPlayer) {
        return;
    }

    if (!canTokenMove(token, diceValue)) {
        return;
    }

    const player =
        players[currentPlayer];

    const roll =
        diceValue;

    const wasSix =
        roll === 6;

    // --------------------------------------
    // HOME -> START
    // --------------------------------------

    if (token.position === -1) {

        token.position = 0;

        resultText.textContent =
            `${player.name} token ${token.number} entered the board.`;

    } else {

        // ----------------------------------
        // NORMAL MOVEMENT
        // ----------------------------------

        token.position += roll;

        resultText.textContent =
            `${player.name} token ${token.number} moved ${roll} spaces.`;
    }

    // --------------------------------------
    // FINISH
    // --------------------------------------

    if (token.position === 57) {

        resultText.textContent =
            `🏆 ${player.name} token ${token.number} reached the finish!`;
    }

    // --------------------------------------
    // CAPTURE
    // --------------------------------------

    captureOpponents(token);

    // --------------------------------------
    // WIN CHECK
    // --------------------------------------

    const finishedTokens =
        tokens.filter(otherToken => {

            return (
                otherToken.playerIndex === currentPlayer &&
                otherToken.position === 57
            );

        }).length;

    renderTokens();

    if (finishedTokens === 4) {

        gameOver = true;

        phase = "GAMEOVER";

        resultText.textContent =
            `🏆 ${player.name} Player Wins!`;

        turnText.textContent =
            `${player.emoji} ${player.name} Player Wins!`;

        updateRollButton();

        return;
    }

    // --------------------------------------
    // IMPORTANT TURN RULE
    // --------------------------------------
    //
    // ONLY a SIX gives another turn.
    //
    // 1-5 -> next player
    // 6   -> same player
    //

    diceValue = null;

    if (wasSix) {

        phase = "ROLL";

        resultText.textContent =
            `${player.name} rolled a 6. Roll again!`;

        // Keep same player.
        updateRollButton();

        return;
    }

    // Normal roll 1-5
    consecutiveSixes = 0;

    phase = "ROLL";

    updateRollButton();

    nextPlayer();
}

// ------------------------------------------
// CAPTURE OPPONENTS
// ------------------------------------------

function captureOpponents(movingToken) {

    // Home/finish/private lane cannot capture.
    if (
        movingToken.position < 0 ||
        movingToken.position > 51
    ) {
        return;
    }

    const movingPlayer =
        players[movingToken.playerIndex];

    const movingTrackIndex =
        (
            movingPlayer.start +
            movingToken.position
        ) % 52;

    // --------------------------------------
    // PROTECTED STARTING SQUARES
    // --------------------------------------

    const protectedStartingSquares =
        players.map(player => player.start);

    if (
        protectedStartingSquares.includes(
            movingTrackIndex
        )
    ) {
        return;
    }

    // --------------------------------------
    // NORMAL SAFE SQUARE
    // --------------------------------------

    if (safeCells.has(movingTrackIndex)) {
        return;
    }

    // --------------------------------------
    // CAPTURE OPPONENT
    // --------------------------------------

    tokens.forEach(otherToken => {

        if (
            otherToken.id === movingToken.id
        ) {
            return;
        }

        if (
            otherToken.playerIndex ===
            movingToken.playerIndex
        ) {
            return;
        }

        if (
            otherToken.position < 0 ||
            otherToken.position > 51
        ) {
            return;
        }

        const otherPlayer =
            players[otherToken.playerIndex];

        const otherTrackIndex =
            (
                otherPlayer.start +
                otherToken.position
            ) % 52;

        if (
            movingTrackIndex === otherTrackIndex
        ) {

            otherToken.position = -1;

            resultText.textContent =
                `${movingPlayer.name} captured ${otherPlayer.name}'s token!`;
        }
    });
}

// ------------------------------------------
// NEXT PLAYER
// ------------------------------------------

function nextPlayer() {

    if (gameOver) {
        return;
    }

    currentPlayer++;

    if (
        currentPlayer >= players.length
    ) {
        currentPlayer = 0;
    }

    diceValue = null;

    consecutiveSixes = 0;

    phase = "ROLL";

    updateTurnDisplay();

    updateRollButton();

    renderTokens();
}

// ------------------------------------------
// UPDATE TURN
// ------------------------------------------

function updateTurnDisplay() {

    const player =
        players[currentPlayer];

    turnText.textContent =
        `${player.emoji} ${player.name} Player's Turn`;

    resultText.textContent =
        `${player.name}, roll the dice.`;
}

// ------------------------------------------
// DICE FACE
// ------------------------------------------

function getDiceFace(number) {

    const faces = {
        1: "⚀",
        2: "⚁",
        3: "⚂",
        4: "⚃",
        5: "⚄",
        6: "⚅"
    };

    return faces[number];
}

// ------------------------------------------
// RESET GAME
// ------------------------------------------

function resetGame() {

    currentPlayer = 0;

    diceValue = null;

    phase = "ROLL";

    consecutiveSixes = 0;

    gameOver = false;

    diceElement.textContent = "⚀";

    createTokens();

    createBoard();

    updateTurnDisplay();

    updateRollButton();

    renderTokens();
}

// ------------------------------------------
// BUTTON EVENTS
// ------------------------------------------

rollButton.addEventListener(
    "click",
    rollDice
);

resetButton.addEventListener(
    "click",
    resetGame
);

// ------------------------------------------
// START GAME
// ------------------------------------------

resetGame();