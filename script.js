// ------------------------------
// 1) GAME STATE (changes while playing)
// ------------------------------
// How far the player has walked (in kilometers)
let distance = 0;
// Player water level (percentage)
let water = 100;
// Player heat level (percentage)
let heat = 0;
// Total game time in seconds
let timeElapsed = 0;
// How many seconds have passed since the player last clicked Walk/Run
let secondsSinceLastMove = 0;

// ------------------------------
// 2) TUNABLE SETTINGS (easy to edit)
// ------------------------------
// Wait this many seconds before cooling starts
const IDLE_COOLDOWN_SECONDS = 5;
// Reduce heat by this amount each second while idle
const HEAT_COOL_RATE = 1;
// Key used to store leaderboard data in localStorage
const LEADERBOARD_KEY = "charityWaterLeaderboard";

// ------------------------------
// 3) TIMER CONTROL
// ------------------------------
// Prevents starting multiple timers
let gameStarted = false;
// Stores the interval id so we can stop the timer later
let timerId = null;

// Keep track of milestone messages so each one appears only once
const milestonesShown = {
	1: false,
	3: false,
	5: false
};

// List of facts used for milestone messages.
// You can add more message strings here anytime.
const milestoneFacts = [
	"Millions of people walk long distances every day to collect water.",
	"Access to clean water changes health, education, and opportunity.",
	"Clean water helps families spend less time collecting water and more time learning and working."
];

// ------------------------------
// 4) CONNECT JAVASCRIPT TO HTML ELEMENTS
// ------------------------------
const distanceEl = document.getElementById("distance");
const waterEl = document.getElementById("water");
const heatEl = document.getElementById("heat");
const distanceProgressEl = document.getElementById("distance-progress");
const waterProgressEl = document.getElementById("water-progress");
const heatProgressEl = document.getElementById("heat-progress");
const timerEl = document.getElementById("timer");
const messageEl = document.getElementById("message");
const resultEl = document.getElementById("result");
const walkButton = document.getElementById("walk-button");
const runButton = document.getElementById("run-button");
const resetButton = document.getElementById("reset-button");
const restartButton = document.getElementById("restart-button");
const leaderboardListEl = document.getElementById("leaderboard-list");

// Create a short confetti animation on the page.
// This uses regular DOM elements (no canvas) so it stays beginner-friendly.
function launchConfetti() {
	const existingLayer = document.querySelector(".confetti-layer");
	if (existingLayer) {
		existingLayer.remove();
	}

	const confettiLayer = document.createElement("div");
	confettiLayer.className = "confetti-layer";
	document.body.insertBefore(confettiLayer, document.body.firstChild);

	const confettiColors = [
		"var(--Yellow)",
		"var(--Blue)",
		"var(--Light-Blue)",
		"var(--Green)",
		"var(--Orange)",
		"var(--Red)",
		"var(--Pink)"
	];

	for (let i = 0; i < 90; i += 1) {
		const piece = document.createElement("span");
		piece.className = "confetti-piece";
		piece.style.left = `${Math.random() * 100}%`;
		piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
		piece.style.animationDelay = `${Math.random() * 0.8}s`;
		piece.style.animationDuration = `${2.2 + Math.random() * 1.4}s`;
		piece.style.transform = `rotate(${Math.random() * 360}deg)`;
		confettiLayer.appendChild(piece);
	}

	// Remove old confetti after animation finishes.
	setTimeout(() => {
		confettiLayer.remove();
	}, 4500);
}

// Read leaderboard array from localStorage.
// Returns an array of completion times in seconds.
function loadLeaderboardTimes() {
	const savedTimes = localStorage.getItem(LEADERBOARD_KEY);

	if (!savedTimes) {
		return [];
	}

	try {
		const parsedTimes = JSON.parse(savedTimes);

		if (Array.isArray(parsedTimes)) {
			return parsedTimes;
		}
	} catch (error) {
		// If data is invalid JSON, reset to an empty list.
		return [];
	}

	return [];
}

// Save leaderboard array to localStorage.
function saveLeaderboardTimes(times) {
	localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(times));
}

// Add a new winning time, sort best-to-worst, keep top 10.
function addTimeToLeaderboard(newTimeSeconds) {
	const times = loadLeaderboardTimes();
	times.push(newTimeSeconds);
	times.sort((a, b) => a - b);

	const topTimes = times.slice(0, 10);
	saveLeaderboardTimes(topTimes);

	return topTimes;
}

// Render leaderboard list in the page.
function renderLeaderboard() {
	const times = loadLeaderboardTimes();
	leaderboardListEl.innerHTML = "";

	if (times.length === 0) {
		const emptyItem = document.createElement("li");
		emptyItem.textContent = "No completed runs yet.";
		leaderboardListEl.appendChild(emptyItem);
		return;
	}

	for (const time of times) {
		const item = document.createElement("li");
		item.textContent = `${time} seconds`;
		leaderboardListEl.appendChild(item);
	}
}

// ------------------------------
// 5) DRAW THE CURRENT GAME STATE ON SCREEN
// ------------------------------
function updateStats() {
	// Clamp values so progress bars never go below 0 or above max
	const safeDistance = Math.min(6, Math.max(0, distance));
	const safeWater = Math.min(100, Math.max(0, water));
	const safeHeat = Math.min(100, Math.max(0, heat));

	// Update text values the player sees
	distanceEl.textContent = distance.toFixed(1);
	waterEl.textContent = safeWater.toFixed(0);
	heatEl.textContent = safeHeat.toFixed(0);

	// Update progress bar fill amounts
	distanceProgressEl.value = safeDistance;
	waterProgressEl.value = safeWater;
	heatProgressEl.value = safeHeat;

	// Update timer text
	timerEl.textContent = timeElapsed;
}

// ------------------------------
// 6) START GAME TIMER (runs every second)
// ------------------------------
function startTimerIfNeeded() {
	// Only start timer once
	if (!gameStarted) {
		gameStarted = true;
		timerId = setInterval(() => {
			// Time always moves forward once per second
			timeElapsed += 1;
			// Track how long player has been idle
			secondsSinceLastMove += 1;

			// If player has been idle for 5+ seconds, reduce heat gradually
			if (secondsSinceLastMove >= IDLE_COOLDOWN_SECONDS && heat > 0) {
				heat -= HEAT_COOL_RATE;
			}

			// Re-render screen each second
			updateStats();
		}, 1000);
	}
}

// ------------------------------
// 7) SHOW MILESTONE MESSAGES
// ------------------------------
function getRandomFact() {
	const randomIndex = Math.floor(Math.random() * milestoneFacts.length);
	return milestoneFacts[randomIndex];
}

function showMilestoneMessage() {
	const randomFact = getRandomFact();
	let milestoneText = "";

	// Check highest milestone first, then lower ones
	// Third milestone: 5 KM
	if (distance >= 5 && !milestonesShown[5]) {
		milestonesShown[5] = true;
		milestoneText = `5 KM reached. ${randomFact}`;
	// Second milestone: 3 KM
	} else if (distance >= 3 && !milestonesShown[3]) {
		milestonesShown[3] = true;
		milestoneText = `3 KM reached. ${randomFact}`;
	// First milestone: 1 KM
	} else if (distance >= 1 && !milestonesShown[1]) {
		milestonesShown[1] = true;
		milestoneText = `1 KM reached. ${randomFact}`;
	}

	// If a milestone was reached, display it on the page.
	// Give a 5% water bonus when milestone is reached.
	if (milestoneText) {
    messageEl.textContent = "Charity: Water reward received! 5% water bonus added.";
		alert(`${milestoneText} Charity: +5% water reward!`);
		water = Math.min(100, water + 5);
		updateStats();
		console.log("Milestone reached! Water increased by 5%. Current water:", water);
	}
}

// ------------------------------
// 8) END THE GAME
// ------------------------------
function endGame(finalMessage, didWin, lossReason) {
	// Show final result text
	resultEl.textContent = `${finalMessage} Time: ${timeElapsed} seconds.`;

	if (didWin) {
		addTimeToLeaderboard(timeElapsed);
		renderLeaderboard();
		launchConfetti();
		console.log("New leaderboard times:", loadLeaderboardTimes());
	} else if (lossReason === "heat") {
		// Show red heat overlay when player loses from overheating
		const heatOverlay = document.createElement("div");
		heatOverlay.className = "heat-overlay";
		document.body.appendChild(heatOverlay);
	}

	// Disable actions so player cannot keep clicking
	walkButton.disabled = true;
	runButton.disabled = true;
	restartButton.hidden = false;

	// Stop the timer interval
	if (timerId) {
		clearInterval(timerId);
		timerId = null;
	}
}

// ------------------------------
// 8.1) RESTART THE GAME
// ------------------------------
function restartGame() {
	const existingLayer = document.querySelector(".confetti-layer");
	if (existingLayer) {
		existingLayer.remove();
	}

	const existingHeatOverlay = document.querySelector(".heat-overlay");
	if (existingHeatOverlay) {
		existingHeatOverlay.remove();
	}

	// Reset game values
	distance = 0;
	water = 100;
	heat = 0;
	timeElapsed = 0;
	secondsSinceLastMove = 0;
	gameStarted = false;

	// Reset milestone tracking
	milestonesShown[1] = false;
	milestonesShown[3] = false;
	milestonesShown[5] = false;

	// Restore UI state
	messageEl.textContent = "Click Walk or Run to start your journey.";
	resultEl.textContent = "Game in progress...";
	walkButton.disabled = false;
	runButton.disabled = false;
	restartButton.hidden = true;

	// Make sure old timer is not still running
	if (timerId) {
		clearInterval(timerId);
		timerId = null;
	}

	// Draw reset values on screen
	updateStats();
}

// ------------------------------
// 9) CHECK WIN/LOSE RULES
// ------------------------------
function checkGameState() {
	// Win condition: reached 6 KM
	if (distance >= 6) {
		endGame("You win! You completed the 6 KM challenge.", true, null);
		return;
	}

	// Lose condition: no water left
	if (water <= 0) {
		endGame("You lose. Your water ran out.", false, "water");
		return;
	}

	// Lose condition: heat reaches dangerous level
	if (heat >= 100) {
		endGame("You lose. Your heat level got too high.", false, "heat");
	}
}

// ------------------------------
// 10) EXTRA WATER LOSS FROM HEAT
// ------------------------------
// Higher heat makes every action cost more water.
function getHeatWaterPenalty() {
	if (heat >= 70) {
		return 3;
	}

	if (heat >= 40) {
		return 2;
	}

	return 0;
}

// ------------------------------
// 11) PLAYER ACTION: WALK
// ------------------------------
function walkAction() {
	// Start timer if this is the first action
	startTimerIfNeeded();
	// Player moved, so reset idle counter
	secondsSinceLastMove = 0;

	// Walk is slower but uses less resources than running
	distance += 0.1;
	heat += 1;

	// Base water cost + extra cost from current heat
	const extraWaterLoss = getHeatWaterPenalty();
	water -= .5 + extraWaterLoss;

	// Refresh UI and check game status
	showMilestoneMessage();
	updateStats();
	checkGameState();
}

// ------------------------------
// 12) PLAYER ACTION: RUN
// ------------------------------
function runAction() {
	// Start timer if this is the first action
	startTimerIfNeeded();
	// Player moved, so reset idle counter
	secondsSinceLastMove = 0;

	// Run is faster but uses more resources than walking
	distance += 0.2;
	heat += 2;

	// Base water cost + extra cost from current heat
	const extraWaterLoss = getHeatWaterPenalty();
	water -= 2 + extraWaterLoss;

	// Refresh UI and check game status
	showMilestoneMessage();
	updateStats();
	checkGameState();
}

// ------------------------------
// 13) CONNECT BUTTON CLICKS TO ACTIONS
// ------------------------------
walkButton.addEventListener("click", walkAction);
runButton.addEventListener("click", runAction);
resetButton.addEventListener("click", restartGame);
restartButton.addEventListener("click", restartGame);

// ------------------------------
// 14) INITIAL SCREEN RENDER
// ------------------------------
updateStats();
renderLeaderboard();
