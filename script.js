// Game board module
const gameBoard = (() => {
  const board = ["", "", "", "", "", "", "", "", ""];

  const getBoard = () => board;

  const makeMove = (index, symbol) => {
    board[index] = symbol;
  };

  const resetBoard = () => {
    board.fill("");
  };

  return {
    getBoard,
    makeMove,
    resetBoard,
  };
})();

// Player factory function
const createPlayer = (name, symbol) => ({ name, symbol });

// AIPlayer factory function
const createAIPlayer = (playerOneSymbol) => {
  const name = "AI";
  // Set the AI player's symbol to the opposite of player's symbol
  const symbol = playerOneSymbol === "X" ? "O" : "X";
  const getMove = (board) => {
    // Find all available moves on the game board
    const availableMoves = board.reduce((moves, cell, index) => {
      if (cell === "") {
        moves.push(index);
      }
      return moves;
    }, []);

    // Initialize variables to track best score and best moves
    let bestScore = -Infinity;
    let bestMoves = [];

    // Evaluate each available move using the minimax algorithm
    for (const move of availableMoves) {
      board[move] = symbol;
      const score = minimax(board, 7, false);
      board[move] = "";
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    // Choose a random move from the best moves available
    const randomIndex = Math.floor(Math.random() * bestMoves.length);
    return bestMoves[randomIndex];
  };

  // Minimax algorithm
  const minimax = (board, depth, isMaximizingPlayer = true) => {
    const winner = checkWin(board);
    if (winner !== null) {
      if (winner === "X") {
        return -10 + depth;
      } else if (winner === "O") {
        return 10 - depth;
      } else {
        return 0;
      }
    }

    if (depth === 0) {
      return 0;
    }

    const availableMoves = board.reduce((moves, cell, index) => {
      if (cell === "") {
        moves.push(index);
      }
      return moves;
    }, []);

    if (availableMoves.length === 0) {
      return 0;
    }

    // Initialize the best score
    let bestScore = isMaximizingPlayer ? -Infinity : Infinity;

    // Evaluate each available move
    for (const move of availableMoves) {
      board[move] = isMaximizingPlayer ? symbol : playerOneSymbol;
      const score = minimax(board, depth - 1, !isMaximizingPlayer);
      board[move] = "";
      if (isMaximizingPlayer ? score > bestScore : score < bestScore) {
        bestScore = score;
      }
    }

    return bestScore;
  };

  // Private method to check if there is a winner or tie
  const checkWin = (board) => {
    const winningPositions = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const positions of winningPositions) {
      const [a, b, c] = positions;
      if (board[a] !== "" && board[a] === board[b] && board[b] === board[c]) {
        return board[a];
      }
    }

    if (board.every(cell => cell !== "")) {
      return "It's a tie!";
    }

    return null;
  };

  return { name, symbol, getMove };
};

// Game flow control module
const gameFlow = (() => {
  const playerOneElement = document.getElementById("player1");
  const playerTwoElement = document.getElementById("player2");
  const messageElement = document.getElementById("message");
  const startButton = document.getElementById("start-button");
  const restartButton = document.getElementById("restart-button");
  const newButton = document.getElementById("new");
  const muteButton = document.getElementById("mute-button");
  const cells = Array.from(document.querySelectorAll(".cell"));
  const clickSound = new Audio("./audio/cell.wav");
  const endSound = new Audio("./audio/end.wav");
  const buttonSound = new Audio("./audio/button.wav");

  let playerOne;
  let playerTwo;
  let currentPlayer;
  let gameOver = false;
  let gameMode = "player"; // Default game mode
  let aiDifficulty = "normal"; // Default AI difficulty
  let isMuted = false;

  // Winning combinations
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  // Start the game
  const startGame = () => {
    // Get player names
    const playerOneName = playerOneElement.querySelector(".player-name").value || "Player One";
    const playerTwoName = gameMode === "player" ? playerTwoElement.querySelector(".player-name").value || "Player Two" : "AI";
    // Get player symbols
    const playerOneSymbol = getPlayerSymbol(playerOneElement);
    const playerTwoSymbol = gameMode === "player" ? getPlayerSymbol(playerTwoElement) : playerOneSymbol === "X" ? "O" : "X";

    // Check if both players have selected a symbol
    if (!playerOneSymbol || !playerTwoSymbol) {
      return;
    }

    // Check if both players use same symbol
    if (playerOneSymbol === playerTwoSymbol) {
      messageElement.textContent = "Both players must choose different symbols!";
      return;
    }

    // Create player objects
    playerOne = createPlayer(playerOneName, playerOneSymbol);
    playerTwo = gameMode === "player" ? createPlayer(playerTwoName, playerTwoSymbol) : createAIPlayer(playerOneSymbol);
    // Set current player
    currentPlayer = playerOne;
    gameOver = false;

    // Set up event listeners and clear game board
    cells.forEach((cell) => {
      cell.addEventListener("click", handleCellClick);
      cell.textContent = "";
    });

    updateGameStatus(`It's ${currentPlayer.name}'s turn.`);
    showRestartButton(false);
    showNewButton(false);
    showStartButton(false);
    document.getElementById("player-selection").classList.add("hidden");
    document.getElementById("game-mode-options").classList.add("hidden");
    document.getElementById("ai-options").classList.add("hidden");
  };

  // Get player symbol
  const getPlayerSymbol = (playerElement) => {
    const symbolButtons = playerElement.querySelectorAll(".symbol-button");
    for (const button of symbolButtons) {
      if (button.classList.contains("selected")) {
        return button.dataset.symbol;
      }
    }
    // Ask player to choose a symbol
    const playerName = playerElement.querySelector(".player-name").value || `Player ${playerElement.id.slice(-1)}`;
    messageElement.textContent = `${playerName}, please choose a symbol.`;
    return null;
  };

  // Handle cell click
  const handleCellClick = (event) => {
    if (gameOver) return;

    const clickedCell = event.target;
    const cellIndex = clickedCell.dataset.cellIndex;

    if (gameBoard.getBoard()[cellIndex] === "") {
      gameBoard.makeMove(cellIndex, currentPlayer.symbol);
      clickedCell.textContent = currentPlayer.symbol;

      // Add current player's symbol to the game board UI
      clickedCell.classList.add(currentPlayer.symbol.toLowerCase());

      playSound(clickSound);

      if (checkWin(currentPlayer.symbol)) {
        gameOver = true;
        updateGameStatus(`${currentPlayer.name} wins!`);
        showRestartButton(true);
        showNewButton(true);

        playSound(endSound);
      } else if (checkTie()) {
        gameOver = true;
        updateGameStatus("It's a tie!");
        showRestartButton(true);
        showNewButton(true);

        playSound(endSound);
      } else {
        switchPlayers();
        updateGameStatus(`It's ${currentPlayer.name}'s turn.`);
      }
    }
  };

  // Switch players
  const switchPlayers = () => {
    currentPlayer = currentPlayer === playerOne ? playerTwo : playerOne;
    if (gameMode === "ai" && currentPlayer === playerTwo) {
      // AI player's turn
      setTimeout(() => {
        const move = playerTwo.getMove(gameBoard.getBoard());
        gameBoard.makeMove(move, playerTwo.symbol);
        cells[move].textContent = playerTwo.symbol;
        cells[move].classList.add(playerTwo.symbol.toLowerCase());

        playSound(clickSound);

        if (checkWin(playerTwo.symbol)) {
          gameOver = true;
          updateGameStatus(`${playerTwo.name} wins!`);
          showRestartButton(true);
          showNewButton(true);
        } else if (checkTie()) {
          gameOver = true;
          updateGameStatus("It's a tie!");
          showRestartButton(true);
          showNewButton(true);
        } else {
          switchPlayers();
          updateGameStatus(`It's ${currentPlayer.name}'s turn.`);
        }
      }, 600);
    }
  };

  // Check if there is a winner
  const checkWin = (symbol) => {
    return winningCombinations.some((combination) => {
      return combination.every((index) => gameBoard.getBoard()[index] === symbol);
    });
  };

  // Check if there is a tie
  const checkTie = () => {
    const board = gameBoard.getBoard();
    return board.every((cell) => cell !== "") && !checkWin(playerOne.symbol) && !checkWin(playerTwo.symbol);
  };

  // Update game status
  const updateGameStatus = (message) => {
    messageElement.textContent = message;
  };

  const showRestartButton = (show) => {
    restartButton.style.display = show ? "block" : "none";
  };

  const showNewButton = (show) => {
    newButton.style.display = show ? "block" : "none";
  };

  const showStartButton = (show) => {
    startButton.style.display = show ? "block" : "none";
  };

  const removeBorderClasses = () => {
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.classList.remove("x", "o");
    });
  };

  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      playSound(buttonSound);
    });
  });

  // Restart game
  const restartGame = () => {
    gameBoard.resetBoard();
    startGame();
    removeBorderClasses(); 
  };

  const playSound = (sound) => {
    if (!isMuted) {
      sound.play();
      sound.currentTime = 0.1;
    }
  };

  // Add event listeners
  const addEventListeners = () => {
    let playerOneSymbol;
    startButton.addEventListener("click", startGame);
    restartButton.addEventListener("click", restartGame);

    // Add symbol selection event listeners
    const symbolButtons = document.querySelectorAll(".symbol-button");
    symbolButtons.forEach((button) => {
      button.addEventListener("click", handleSymbolButtonClick);
    });

    // AI difficulty selection event listener
    const aiDifficultySelect = document.getElementById("ai-difficulty");
    aiDifficultySelect.addEventListener("change", (event) => {
      aiDifficulty = event.target.value;
      playerTwo = createAIPlayer(playerOneSymbol);
      const playerOneXButton = document.querySelector(".player1-symbol-button[data-symbol='X']");
      const playerOneOButton = document.querySelector(".player1-symbol-button[data-symbol='O']");
      if (gameMode === "ai" && aiDifficulty === "impossible") {
        playerOneOButton.classList.add("hidden");
        playerOneXButton.classList.remove("hidden");
      } else if (aiDifficulty === "normal") {
        playerOneOButton.classList.remove("hidden");
        playerOneXButton.classList.add("hidden");
      }
      const aiDifficultyOptions = document.querySelectorAll("#ai-difficulty option");
      aiDifficultyOptions.forEach((option) => {
        if (option.value === aiDifficulty) {
          option.setAttribute("selected", true);
        } else {
          option.removeAttribute("selected");
        }
      });
    });

    // Game mode selection event listener
    const gameModeSelect = document.getElementById("game-mode");
    gameModeSelect.addEventListener("change", () => {
      gameMode = gameModeSelect.value;
      if (gameMode === "ai") {
        const playerOneXButton = document.querySelector(".player1-symbol-button[data-symbol='X']");
        playerOneXButton.classList.add("hidden");
        playerTwoElement.querySelector(".player-name").value = "AI";
        const playerOneSymbol = getPlayerSymbol(playerOneElement);
        const aiDifficultySelect = document.getElementById("ai-difficulty");
        const aiDifficulty = aiDifficultySelect.value;
        playerTwo = createAIPlayer(playerOneSymbol, gameMode, aiDifficulty);
        if (playerOneSymbol === "O") {
          playerTwoElement.querySelector(".symbol-button[data-symbol= 'X']").click();
        } else {
          playerTwoElement.querySelector(".symbol-button[data-symbol= 'O']").click();
        }
        playerTwoElement.classList.add("hidden");
        document.getElementById("ai-options").classList.remove("hidden")
      } else {
        playerTwoElement.classList.remove("hidden");
        document.getElementById("ai-options").classList.add("hidden");
      }
      
    });

    // Mute button event listener
    muteButton.addEventListener("click", () => {
      isMuted = !isMuted;
      muteButton.textContent = isMuted ? "Unmute" : "Mute";
    });
  };

  
  let currentPlayerElement = playerOneElement;

  // Handle symbol button click
  const handleSymbolButtonClick = (event) => {
    const clickedButton = event.target;
    const selectedSymbol = clickedButton.dataset.symbol;

    // Add 'selected' class to clicked button
    clickedButton.classList.add("selected");

    // Update message element
    const playerName = currentPlayerElement.querySelector(".player-name").value || `Player ${currentPlayerElement.id.slice(-1)}`;
    messageElement.textContent = `${playerName} selected ${selectedSymbol}.`;

    // Switch to next player
    if (currentPlayerElement === playerOneElement) {
      currentPlayerElement = playerTwoElement;
    } else {
      currentPlayerElement = playerOneElement;
    }
  };

  return {
    addEventListeners,
  };
})();

// Add event listeners
gameFlow.addEventListeners();
