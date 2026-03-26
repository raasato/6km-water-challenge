// --------------------------------
// 1) GAME STATE (changes while playing)
// --------------------------------
// These variables track everything currently happening in the game.
// They change every time the player clicks Walk or Run.

// How far the player has walked (in kilometers)
let distance = 0;

// Player's water level (percentage: 0-100)
// Water decreases with each action. If it reaches 0, the player loses.
let water = 100;

// Player's heat level (percentage: 0-100, used in all seasons except winter)
// Heat increases when player is active and decreases when idle.
// If it reaches 100, the player loses from overheating.
let heat = 0;

// Player's frost level (percentage: 0-100, used only in winter season)
// Similar to heat, but themed for cold weather. If it reaches 100, the player loses from freezing.
let frost = 0;

// Total game time in seconds - increases every second while playing
let timeElapsed = 0;

// How many seconds have passed since the player last clicked Walk or Run
// Used to determine when the player is "idle" and heat should cool down
let secondsSinceLastMove = 0;

// Current season/difficulty level chosen by the player
// Options: "fall" (easy), "spring" (medium), "winter" (hard), "summer" (hardest)
let season = "fall";

// Track active items
let activeItems = 0;
const MAX_ITEMS = 5;

// --------------------------------
// 2) GAME SETTINGS (easy to change)
// --------------------------------
// How many seconds of inactivity before heat starts cooling down
const IDLE_COOLDOWN_SECONDS = 5;

// How much heat to reduce each second when the player is idle
const HEAT_COOL_RATE = 1;

// Key for saving leaderboard times to the browser's storage
const LEADERBOARD_KEY = "charityWaterLeaderboard";

// --------------------------------
// 2.5) SOUND SETTINGS
// --------------------------------
// Create reusable sound objects once so we can play them during the game.
const sounds = {
	walk: new Audio("sound/walk.mp3"),
	win: new Audio("sound/game-win.mp3"),
  run: new Audio("sound/run.mp3"),
  rain: new Audio("sound/rain.mp3"),
  fire: new Audio("sound/fire.mp3"),
  lose: new Audio("sound/game-lose.mp3"),
  milestone: new Audio("sound/milestone.mp3"),
  water: new Audio("sound/water-drop.mp3"),
  money: new Audio("sound/money.mp3"),
  splash: new Audio("sound/splash.mp3"),
  warmth: new Audio("sound/warmth.mp3"),
  wind: new Audio("sound/wind.mp3")
};

// Keep the volume moderate so effects are noticeable but not too loud.
sounds.walk.volume = 0.45;
sounds.win.volume = 0.6;
sounds.run.volume = 0.6;
sounds.rain.volume = 0.5;
sounds.fire.volume = 0.5;
sounds.lose.volume = 0.6;
sounds.milestone.volume = 0.5;
sounds.water.volume = 0.5;
sounds.money.volume = 0.5;
sounds.splash.volume = 0.5;
sounds.warmth.volume = 0.5;
sounds.wind.volume = 0.5;

// Helper function to play a sound from the start each time.
function playSound(soundEffect) {
	if (!soundEffect) {
		return;
	}

	soundEffect.currentTime = 0;
	soundEffect.play().catch((error) => {
		console.log("Sound could not play yet:", error.message);
	});
}

// --------------------------------
// 3) GAME STATE - TIMER AND MILESTONES
// --------------------------------
// Prevents accidentally starting multiple timers
let gameStarted = false;

// Stores the timer ID so we can stop it later with clearInterval()
let timerId = null;

// Tracks which milestone messages have been shown (to show each only once)
// Keys are distance in kilometers: 1, 3, 5
const milestonesShown = {
	1: false,
	3: false,
	5: false
};

// Fun facts about water that display when player reaches a milestone
// Easy to add more - just add another string to the array!
const milestoneFacts = [
	"Access to clean water means education, income and health - especially for women and children.",
	"696 million people in the world live without clean water.",
	"People spend hours every day walking to collect water for their family, keeping children out of school and adults out of work.",
  "The water collected often carries diseases that can make everyone sick.",
  "Children under-five are on average more than 20 times more likely to die from illnesses linked to unsafe water and bad sanitation than from conflict.",
  "Women and girls are responsible for water collection in 7 out of 10 households."
];

// --------------------------------
// 4) CONNECT JAVASCRIPT TO HTML ELEMENTS
// --------------------------------
// These variables save references to HTML elements so we can update them quickly.
// Saving them as variables is faster than using getElementById() every time.
// Display elements that show game stats to the player
const distanceEl = document.getElementById("distance");
const waterEl = document.getElementById("water");
const heatEl = document.getElementById("heat");

// Progress bar fill elements (colored bars that scale with stats)
const distanceProgressEl = document.getElementById("distance-progress");
const waterProgressEl = document.getElementById("water-progress");
const heatProgressEl = document.getElementById("heat-progress");

// Timer and message elements
const timerEl = document.getElementById("timer");
const messageEl = document.getElementById("message");
const resultEl = document.getElementById("result");

// Buttons the player can click
const walkButton = document.getElementById("walk-button");
const runButton = document.getElementById("run-button");
const resetButton = document.getElementById("reset-button");
const restartButton = document.getElementById("restart-button");

// Leaderboard display
const leaderboardListEl = document.getElementById("leaderboard-list");

// Season selector dropdown
const seasonSelect = document.getElementById("season-select");

// --------------------------------
// 5) SEASON SELECTOR EVENT LISTENER
// --------------------------------
// When the player picks a different season, update the label and styling.
// In winter, we display "Frost" instead of "Heat" and use a different color.
seasonSelect.addEventListener("change", () => {
	season = seasonSelect.value;

	// Update UI to reflect winter theme
	if (season === "winter") {
		document.getElementById("heat-label").textContent = "Frost";
		heatProgressEl.classList.add("winter-bar"); // Changes progress bar to blue
	} else {
		document.getElementById("heat-label").textContent = "Heat";
		heatProgressEl.classList.remove("winter-bar");
	}

	console.log("Season changed to:", season);
});

// ================================
// FUNCTIONS - CONFETTI & LEADERBOARD
// ================================

// Visual celebration effect: colorful confetti pieces fall down the screen.
// Uses only DOM elements (no canvas), so it's beginner-friendly.
function launchConfetti() {
	console.log("launchConfetti() called");

	// Remove any confetti from a previous win to prevent buildup
	const existingLayer = document.querySelector(".confetti-layer");
	if (existingLayer) {
		existingLayer.remove();
	}

	// Create a container for confetti pieces
	const confettiLayer = document.createElement("div");
	confettiLayer.className = "confetti-layer";
	document.body.insertBefore(confettiLayer, document.body.firstChild);

	// Choose from brand colors for the confetti pieces
	const confettiColors = [
		"var(--Yellow)",
		"var(--Blue)",
		"var(--Light-Blue)",
		"var(--Green)",
		"var(--Orange)",
		"var(--Red)",
		"var(--Pink)"
	];

	// Create 90 individual confetti pieces
	for (let i = 0; i < 90; i += 1) {
		const piece = document.createElement("span");
		piece.className = "confetti-piece";

		// Random horizontal position (0-100% across the screen)
		piece.style.left = `${Math.random() * 100}%`;

		// Random color from the list
		piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];

		// Stagger animation start times so confetti doesn't all fall at once
		piece.style.animationDelay = `${Math.random() * 0.8}s`;

		// Random fall speed (faster or slower animation)
		piece.style.animationDuration = `${2.2 + Math.random() * 1.4}s`;

		// Random rotation for visual variety
		piece.style.transform = `rotate(${Math.random() * 360}deg)`;

		confettiLayer.appendChild(piece);
	}

	// Clean up confetti after the animation completes
	setTimeout(() => {
		console.log("[Confetti] Removing confetti layer after animation");
		confettiLayer.remove();
	}, 4500);

	console.log("=== CONFETTI END ===");
}

// ===============================================
// Screen visuals for Spring rain and winter snow
// ===============================================
function launchRainEffect() {
	console.log("launchRainEffect() called");
	playSound(sounds.rain);

	// Remove old rain layer first to avoid stacking multiple effects
	const existingRainLayer = document.querySelector(".rain-layer");
	if (existingRainLayer) {
		existingRainLayer.remove();
	}

	const rainLayer = document.createElement("div");
	rainLayer.className = "rain-layer";
	document.body.appendChild(rainLayer);

	// Create simple raindrops with random positions and speeds
	for (let i = 0; i < 75; i += 1) {
		const drop = document.createElement("span");
		drop.className = "rain-drop";
		drop.style.left = `${Math.random() * 100}%`;
		drop.style.animationDelay = `${Math.random() * 0.45}s`;
		drop.style.animationDuration = `${0.55 + Math.random() * 0.45}s`;
		drop.style.opacity = `${0.55 + Math.random() * 0.35}`;
		rainLayer.appendChild(drop);
	}

	// Auto-clean after the short weather event ends
	setTimeout(() => {
		rainLayer.remove();
	}, 1800);
}

function startSnow() {
	console.log("startSnow() called");

	// Remove old snow layer first to avoid stacking multiple effects
	const existingSnowLayer = document.querySelector(".snow-overlay");
	if (existingSnowLayer) {
		existingSnowLayer.remove();
	}

	const snowLayer = document.createElement("div");
	snowLayer.className = "snow-overlay";
	document.body.appendChild(snowLayer);

	// Create simple snowflakes with random positions and speeds (like rain)
	for (let i = 0; i < 75; i += 1) {
		const snowflake = document.createElement("div");
		snowflake.className = "snowflake";
		snowflake.textContent = "❄️";

		snowflake.style.left = `${Math.random() * 100}%`;
		snowflake.style.animationDelay = `${Math.random() * 0.45}s`;
		snowflake.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
		snowflake.style.opacity = `${0.6 + Math.random() * 0.3}`;

		snowLayer.appendChild(snowflake);
	}

	// Auto-clean after the short weather event ends (like rain)
	setTimeout(() => {
		snowLayer.remove();
	}, 1800);

	console.log("=== SNOW END ===");
}

// Visual heat effect for summer: screen flashes red with a heat pulse
function launchHeatEffect() {
	console.log("launchHeatEffect() called");
  playSound(sounds.fire);

	// Remove any existing heat overlay to prevent stacking
	const existingHeatOverlay = document.querySelector(".heat-overlay");
	if (existingHeatOverlay) {
		existingHeatOverlay.remove();
	}

	// Create the red heat overlay
	const heatOverlay = document.createElement("div");
	heatOverlay.className = "heat-overlay";
	document.body.insertBefore(heatOverlay, document.body.firstChild);

	// Auto-clean after the animation completes
	setTimeout(() => {
		heatOverlay.remove();
	}, 600);

	console.log("=== HEAT EFFECT END ===");
}

// Visual frost effect for winter: screen flashes blue with a frost pulse
function launchFrostEffect() {
	console.log("launchFrostEffect() called");

	// Remove any existing frost overlay to prevent stacking
	const existingFrostOverlay = document.querySelector(".frost-overlay");
	if (existingFrostOverlay) {
		existingFrostOverlay.remove();
	}

	// Create the blue frost overlay
	const frostOverlay = document.createElement("div");
	frostOverlay.className = "frost-overlay";
	document.body.insertBefore(frostOverlay, document.body.firstChild);

	// Auto-clean after the animation completes
	setTimeout(() => {
		frostOverlay.remove();
	}, 600);

	console.log("=== FROST EFFECT END ===");
}

// Visual water loss effect: screen flashes grey when player dies of thirst
function launchWaterLossEffect() {
	console.log("launchWaterLossEffect() called");

	// Remove any existing water loss overlay to prevent stacking
	const existingWaterLossOverlay = document.querySelector(".water-loss-overlay");
	if (existingWaterLossOverlay) {
		existingWaterLossOverlay.remove();
	}

	// Create the grey water loss overlay
	const waterLossOverlay = document.createElement("div");
	waterLossOverlay.className = "water-loss-overlay";
	document.body.insertBefore(waterLossOverlay, document.body.firstChild);

	// Keep the overlay visible (no timeout - it stays for the end game screen)
	console.log("=== WATER LOSS EFFECT END ===");
}

// Read the leaderboard times from the browser's local storage.
// Returns an array of completion times (in seconds) sorted from fastest to slowest.
function loadLeaderboardTimes() {
	console.log("loadLeaderboardTimes() called");
	// Get the saved data from localStorage
	const savedTimes = localStorage.getItem(LEADERBOARD_KEY);

	// If nothing was saved yet, return an empty list
	if (!savedTimes) {
		console.log("[Leaderboard] No saved times found");
		return [];
	}

	try {
		// Convert the saved text back into a JavaScript array
		const parsedTimes = JSON.parse(savedTimes);

		// Only return it if it's actually an array (safety check)
		if (Array.isArray(parsedTimes)) {
			console.log("[Leaderboard] Loaded times:", parsedTimes);
			return parsedTimes;
		}
	} catch (error) {
		// If the saved data is corrupted, start fresh
		console.log("Leaderboard data corrupted, resetting...");
		return [];
	}

	console.log("[Leaderboard] Saved data exists but was not a valid array");
	return [];
}

// Save the leaderboard times to the browser's local storage.
// This persists the leaderboard even after the player closes the browser.
function saveLeaderboardTimes(times) {
	console.log("[Leaderboard] Saving times:", times);
	localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(times));
}

// Add a new win time to the leaderboard.
// Keeps only the top 10 fastest times, sorted from fastest to slowest.
function addTimeToLeaderboard(newTimeSeconds) {
	console.log("[Leaderboard] New time to add:", newTimeSeconds);
	// Load existing times
	const times = loadLeaderboardTimes();
	console.log("[Leaderboard] Times before adding new score:", times);

	// Add the new time
	times.push(newTimeSeconds);

	// Sort from fastest (lowest number) to slowest (highest number)
	times.sort((a, b) => a - b);

	// Keep only the top 10 times
	const topTimes = times.slice(0, 10);

	// Save the updated leaderboard
	saveLeaderboardTimes(topTimes);
	console.log("[Leaderboard] Top 10 times after update:", topTimes);

	return topTimes;
}

// Display the leaderboard on the page.
// Shows "No completed runs yet" if the leaderboard is empty.
function renderLeaderboard() {
	console.log("renderLeaderboard() called");
	// Get the current leaderboard times
	const times = loadLeaderboardTimes();

	// Clear the leaderboard display
	leaderboardListEl.innerHTML = "";

	// If no times have been recorded, show a message
	if (times.length === 0) {
		console.log("[Leaderboard] Rendering empty leaderboard message");
		const emptyItem = document.createElement("li");
		emptyItem.textContent = "No completed runs yet.";
		leaderboardListEl.appendChild(emptyItem);
		return;
	}

	// Add each time to the display
	for (const time of times) {
		const item = document.createElement("li");
		item.textContent = `${time} seconds`;
		leaderboardListEl.appendChild(item);
	}

	console.log("[Leaderboard] Rendered times count:", times.length);
}

// ================================
// FUNCTIONS - GAME DISPLAY
// ================================

// Update all on-screen stats to show the current game state.
// This is called after every player action and every timer tick.
function updateStats() {

	// Clamp values to valid ranges so progress bars never escape their containers
	const safeDistance = Math.min(6, Math.max(0, distance));
	const safeWater = Math.min(100, Math.max(0, water));
	const safeHeat = Math.min(100, Math.max(0, heat));

	// Update distance display (rounded to 1 decimal place)
	distanceEl.textContent = distance.toFixed(1);

	// Update water percentage display (whole number)
	waterEl.textContent = safeWater.toFixed(0);

	// Update timer display
	timerEl.textContent = timeElapsed;

	// Update progress bar widths (as percentages of their maximum)
	distanceProgressEl.style.width = `${(safeDistance / 6) * 100}%`;
	waterProgressEl.style.width = `${safeWater}%`;

	// Update heat/frost display based on current season
	// IMPORTANT: In winter, we track "frost" instead of "heat"
	if (season === "winter") {
		heatEl.textContent = frost.toFixed(0);
		heatProgressEl.style.width = `${Math.min(100, frost)}%`;
	} else {
		heatEl.textContent = safeHeat.toFixed(0);
		heatProgressEl.style.width = `${safeHeat}%`;
	}
}

// ================================
// FUNCTIONS - GAME TIMER
// ================================

// Start the game timer if it hasn't started yet.
// The timer:
// - Increases timeElapsed by 1 every second
// - Tracks idle time to cool down the player's heat
// - Updates the screen every second
// This function only runs once, even if called multiple times.
function startTimerIfNeeded() {
	console.log("startTimerIfNeeded() called. gameStarted:", gameStarted);
	// Safety check: only start timer once
	if (!gameStarted) {
		console.log("[Timer] Starting game timer interval");
		gameStarted = true;

		// Set up a timer to run every 1000 milliseconds (1 second)
		timerId = setInterval(() => {
			// Time always moves forward
			timeElapsed += 1;

			// Track how long the player has been idle (not clicking Walk/Run)
			secondsSinceLastMove += 1;

			// Cool down mechanic: if idle for 5+ seconds, reduce heat gradually
			if (secondsSinceLastMove >= IDLE_COOLDOWN_SECONDS && heat > 0) {
				heat -= HEAT_COOL_RATE;
			}

			// Refresh the display every second
			updateStats();
		}, 1000);
	} else {
		console.log("[Timer] Timer already running. No new interval created.");
	}
}

// ================================
// FUNCTIONS - MILESTONES & REWARDS
// ================================

// Pick a random charitable fact to show when player reaches a milestone.
function getRandomFact() {
	const randomIndex = Math.floor(Math.random() * milestoneFacts.length);
	console.log("[Milestone] Random fact index selected:", randomIndex);
	return milestoneFacts[randomIndex];
}

// Check if the player has reached a new distance milestone (1, 3, or 5 KM).
// If so, show a message and give them a 5% water bonus.
// Each milestone message only shows once per game.
function showMilestoneMessage() {
	console.log("[Milestone] State before check:", { distance, water, season });
	// Get a random fact to include in the message
	const randomFact = getRandomFact();
	let milestoneText = "";

	// Check milestones from farthest to closest
	// This ensures we don't show milestone 1 and 3 in the same moment

	// Milestone 3: 5 KM reached
	if (distance >= 5 && !milestonesShown[5]) {
		console.log("[Milestone Trigger] 5 KM milestone reached");
		milestonesShown[5] = true;
		milestoneText = `5 KM reached. ${randomFact}`;
	}
	// Milestone 2: 3 KM reached
	else if (distance >= 3 && !milestonesShown[3]) {
		console.log("[Milestone Trigger] 3 KM milestone reached");
		milestonesShown[3] = true;
		milestoneText = `3 KM reached. ${randomFact}`;
	}
	// Milestone 1: 1 KM reached
	else if (distance >= 1 && !milestonesShown[1]) {
		console.log("[Milestone Trigger] 1 KM milestone reached");
		milestonesShown[1] = true;
		milestoneText = `1 KM reached. ${randomFact}`;
	}

	// If a milestone was reached, reward the player and show a celebration
	if (milestoneText) {
		console.log("[Milestone] Triggered message:", milestoneText);
		console.log("[Milestone] Water before reward:", water);
		messageEl.textContent = "Charity: Water reward received! 10% water bonus added.";
    playSound(sounds.milestone); // Play milestone sound effect

		// Give 10% water bonus, but cap at 100%
		water = Math.min(100, water + 10);
		console.log("[Milestone] Water after reward:", water);

    let bonusText = "💧 +10% water bonus!"

    if (season === "winter") {
      frost = Math.max(0, frost - 5); // Reduce frost by 5% as a bonus in winter
      messageEl.textContent = "Charity: Water reward received! 10% water bonus added. Winter bonus: Reduced frost!";
    }
    messageEl.textContent = "Milestone reached! Bonus applied.";

      // ✅ SHOW POPUP INSTEAD OF ALERT
      createPopup(
        "🎉 Milestone Reached!",
        `
        <p><strong>${milestoneText}</strong></p>
        <p>${bonusText}</p>
        `
      );
		// Update display to show new water level
		updateStats();

		console.log("Milestone reached! Water increased by 5%. Current water:", water);
	} else {
		console.log("[Milestone] No new milestone triggered this action");
	}
}

// ===============================
// Instructions and leaderboard buttons
// ===============================

function createPopup(title, contentHTML) {
  const overlay = document.createElement("div");
	overlay.className = "popup-overlay";

	const popup = document.createElement("div");
	popup.className = "popup-box";

	popup.innerHTML = `
		<h2>${title}</h2>
		<div class="popup-content">${contentHTML}</div>
		<button class="close-popup">Close</button>
	`;

	overlay.appendChild(popup);
	document.body.appendChild(overlay);

	// Close button
	popup.querySelector(".close-popup").addEventListener("click", () => {
		overlay.remove(); // ✅ removes from DOM
	});

	// Optional: click outside to close
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) {
			overlay.remove();
		}
	});
}

document.getElementById("instructions-button").addEventListener("click", () => {
	createPopup("How to Play", `
	<p>🎮 Walk or Run to reach <strong>6 KM</strong>.</p>

	<p>💧 Manage your <strong>water</strong> — if it reaches 0, you lose.</p>

	<p>🌡️ Manage <strong>heat</strong> (or ❄️ frost in winter).</p>
	<p>If heat/frost reaches 100%, the game ends.</p>

	<p>🌦️ Each season has unique challenges:</p>
	<ul>
		<li>🍂 Fall: Balanced gameplay</li>
		<li>🌸 Spring: Rain can help or slow you</li>
		<li>❄️ Winter: Frost replaces heat, snowfall increases danger</li>
		<li>☀️ Summer: Extreme heat and heat waves</li>
	</ul>

	<p>✨ Click items that appear:</p>
	<ul>
		<li>💧 Water items increase water</li>
		<li>🔥 Fire reduces frost (winter)</li>
		<li>🌳 Trees reduce heat (summer)</li>
		<li>💰 Donations give bonuses</li>
	</ul>

	<p>🎉 Reach milestones (1, 3, 5 KM) for rewards!</p>

	<p>🏆 Finish faster to rank higher on the leaderboard.</p>
	`);
});

document.getElementById("leaderboard-button").addEventListener("click", () => {
	const times = loadLeaderboardTimes();

	let content = "<ul>";

	if (times.length === 0) {
		content += "<li>No runs yet.</li>";
	} else {
		times.forEach(time => {
			content += `<li>${time} seconds</li>`;
		});
	}

	content += "</ul>";

	createPopup("Leaderboard 🏆", content);
});

// ================================
// FUNCTIONS - GAME END & RESTART
// ================================

// End the game - display results and either celebrate or show the loss effect.
// Parameters:
// - finalMessage: Text to show as the game result
// - didWin: true if player won, false if they lost
// - lossReason: what caused the loss ("water", "heat", or "frost") - only used if didWin is false
function endGame(finalMessage, didWin, lossReason) {
	console.log("[EndGame] Game ended with:", { finalMessage, didWin, lossReason });

	// Display the final result message
	resultEl.textContent = finalMessage;

	// Show visual celebration or loss effects
	if (didWin) {
		console.log("[EndGame] Player won! Launching celebration effects");
		launchConfetti(); // Celebrate the victory!
    playSound(sounds.win); // Play win sound effect
		addTimeToLeaderboard(timeElapsed); // Add this win to the leaderboard
		renderLeaderboard(); // Update the displayed leaderboard
	} else {
		// Player lost - show the appropriate loss overlay
    playSound(sounds.lose); // Play lose sound effect
		if (lossReason === "frost") {
			console.log("[EndGame] Loss reason: frost - launching frost effect");
			launchFrostEffect();
		} else if (lossReason === "heat") {
			console.log("[EndGame] Loss reason: heat - launching heat effect");
			launchHeatEffect();
		} else if (lossReason === "water") {
			console.log("[EndGame] Loss reason: water - launching water loss effect");
			launchWaterLossEffect();
		}
	}

	// Clean up any active game effects from during gameplay
	document.querySelectorAll(
		".confetti-layer, .heat-overlay, .frost-overlay, .rain-layer, .snow-overlay, .heat-danger-overlay, .water-loss-overlay"
	).forEach(el => {
		// Only remove temporary effects, keep the end-game overlay
		if (!el.classList.contains("heat-overlay") && !el.classList.contains("frost-overlay") && !el.classList.contains("water-loss-overlay")) {
			console.log("[EndGame] Removing gameplay effect:", el.className);
			el.remove();
		}
	});

	// Prevent further player actions
	walkButton.disabled = true;
	runButton.disabled = true;

	// Create the game stats popup
	const heatLabel = season === "winter" ? "Frost" : "Heat";
	const heatValue = season === "winter" ? frost : heat;
	const statsHTML = `
		<div style="text-align: left; margin: 15px 0;">
			<p><strong>📍 Distance:</strong> ${distance.toFixed(1)} / 6.0 KM</p>
			<p><strong>💧 Water:</strong> ${water.toFixed(0)}%</p>
			<p><strong>🌡️ ${heatLabel}:</strong> ${heatValue.toFixed(0)}%</p>
			<p><strong>⏱️ Time:</strong> ${timeElapsed} seconds</p>
			<p><strong>🌍 Season:</strong> ${season.charAt(0).toUpperCase() + season.slice(1)}</p>
		</div>
	`;

	// Create overlay and popup manually so we can add a custom button
	const overlay = document.createElement("div");
	overlay.className = "popup-overlay";

	const popup = document.createElement("div");
	popup.className = "popup-box";

	popup.innerHTML = `
		<h2>${finalMessage}</h2>
		${statsHTML}
		<button class="close-popup" style="margin-top: 20px; width: 100%; padding: 10px; cursor: pointer; background: linear-gradient(135deg, #8BD1CB, #2E9DF7); color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 1rem;">
			Play Again!
		</button>
	`;

	overlay.appendChild(popup);
	document.body.appendChild(overlay);

	// Play Again button
	popup.querySelector(".close-popup").addEventListener("click", () => {
		overlay.remove();
		restartGame();
	});

	// Optional: click outside to close (but don't restart)
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) {
			overlay.remove();
		}
	});

	// Stop the timer so time doesn't keep increasing
	if (timerId) {
		console.log("[EndGame] Clearing timer interval");
		clearInterval(timerId);
		timerId = null;
	}
}

// Reset the entire game to its starting state.
// This allows the player to play again.
function restartGame() {
	console.log("[Restart] State before reset:", {
		distance,
		water,
		heat,
		frost,
		season,
		timeElapsed,
		secondsSinceLastMove,
		gameStarted
	});
	// Clean up visual effects from previous game
	const existingLayer = document.querySelector(".confetti-layer");
	if (existingLayer) {
		console.log("[Restart] Removing existing confetti layer");
		existingLayer.remove();
	}

	const existingHeatOverlay = document.querySelector(".heat-overlay");
	if (existingHeatOverlay) {
		console.log("[Restart] Removing existing heat overlay");
		existingHeatOverlay.remove();
	}

	const existingFrostOverlay = document.querySelector(".frost-overlay");
	if (existingFrostOverlay) {
		console.log("[Restart] Removing existing frost overlay");
		existingFrostOverlay.remove();
	}

	const existingRainLayer = document.querySelector(".rain-layer");
	if (existingRainLayer) {
		console.log("[Restart] Removing existing rain layer");
		existingRainLayer.remove();
	}

	const existingWaterLossOverlay = document.querySelector(".water-loss-overlay");
	if (existingWaterLossOverlay) {
		console.log("[Restart] Removing existing water loss overlay");
		existingWaterLossOverlay.remove();
	}

	// Reset all game values to starting state
	distance = 0;
	water = 100;
	heat = 0;
	frost = 0;
	timeElapsed = 0;
	secondsSinceLastMove = 0;
	gameStarted = false;

	// Reset milestone tracking so messages can show again
	milestonesShown[1] = false;
	milestonesShown[3] = false;
	milestonesShown[5] = false;

	// Restore UI to its starting state
	messageEl.textContent = "Click Walk or Run to start your journey.";
	resultEl.textContent = "Game in progress...";
	walkButton.disabled = false;
	runButton.disabled = false;
	restartButton.hidden = true;

	// Stop any running timer
	if (timerId) {
		console.log("[Restart] Clearing running timer interval");
		clearInterval(timerId);
		timerId = null;
	}

    // Remove leftover items
  document.querySelectorAll(".item").forEach(item => item.remove());
  activeItems = 0;

	// Refresh the display
	updateStats();

	console.log("[Restart] State after reset:", {
		distance,
		water,
		heat,
		frost,
		season,
		timeElapsed,
		secondsSinceLastMove,
		gameStarted
	});
}

// ================================
// FUNCTIONS - GAME RULES & PENALTIES
// ================================

// Check current game status and end the game if a win/lose condition is met.
// Win: reach 6 KM
// Lose: water reaches 0, OR heat/frost reaches 100
function checkGameState() {
	console.log("[CheckGameState] Current values:", { distance, water, heat, frost, season });
	// WIN: Player made it 6 KM
	if (distance >= 6) {
		console.log("[CheckGameState] WIN condition met: distance >= 6");
		endGame("You win! You completed the 6 KM challenge.", true, null);
		return;
	}

	// LOSE: Player ran out of water
	if (water <= 0) {
		console.log("[CheckGameState] LOSE condition met: water <= 0");
		endGame("You lose. Your water ran out.", false, "water");
		return;
	}

	// LOSE: Player got too cold (winter only)
	if (season === "winter") {
		if (frost >= 100) {
			console.log("[CheckGameState] LOSE condition met: winter frost >= 100");
			endGame("You froze in the cold.", false, "frost");
		}
	}
	// LOSE: Player got too hot (all other seasons)
	else{
		if (heat >= 100) {
			console.log("[CheckGameState] LOSE condition met: heat >= 100");
			endGame("You lose. Your heat level got too high.", false, "heat");
		}
	}
}

// Calculate extra water loss based on current heat level.
// High heat makes every action drain more water as the player gets more desperate.
// This is NOT applied in winter (we use frost instead).
function getHeatWaterPenalty() {
	console.log("[Penalty] Current heat:", heat);
	if (heat >= 70) {
		console.log("[Penalty] Heat >= 70, extra water loss = 3");
		return 3; // Very hot: lose 3 extra water per action
	}

	if (heat >= 40) {
		console.log("[Penalty] Heat >= 40, extra water loss = 2");
		return 2; // Moderately hot: lose 2 extra water per action
	}

	console.log("[Penalty] Heat < 40, extra water loss = 0");
	return 0; // Not hot: no penalty
}

// ================================
// FUNCTIONS - PLAYER ACTIONS
// ================================

// Spawn function for season + donation
function spawnItem() {
  if (activeItems >= MAX_ITEMS) return; // Don't spawn more if we've reached the limit
  const item = document.createElement("div");
  item.classList.add("item");

  let type = "season"; // Default type

  // 20% chance for donation
  if (Math.random() < 0.3) {
    type = "donation";
    item.classList.add("donation-item");
    item.textContent = "💰";

    item.onclick = () => {
      water = Math.min(100, water + 10); // Donation gives 10% water
      messageEl.textContent = "You received a donation! +10% water.";
      console.log("Donation received!");
      item.remove();
      activeItems--;
      updateStats();
      playSound(sounds.money); // Play donation sound effect
    };
  }
  else {
    // FALL
    if (season === "fall") {
      item.classList.add("fall-item");
      item.textContent = "💧";

      item.onclick = () => {
        water = Math.min(100, water + 5);
        messageEl.textContent = "You found water! +5% water.";
        console.log("Water found!");
        item.remove();
        activeItems--;
        updateStats();
        playSound(sounds.water); // Play water collection sound effect
      };
    }
    // SPRING
    else if (season === "spring") {
      item.classList.add("spring-item");
      item.textContent = "🌧️"
      
      item.onclick = () => {
        water = Math.min(100, water + 7);
        messageEl.textContent = "You collected rainwater! +7% water.";
        console.log("Rainwater collected!");
        item.remove();
        activeItems--;
        updateStats();
        playSound(sounds.splash); // Play rain collection sound effect
      };
    }
    // WINTER
    else if (season === "winter") {
      item.classList.add("winter-item");
      item.textContent = "🔥";

      item.onclick = () => {
        frost = Math.max(0, frost - 10); // Reduces frost by 10%
        messageEl.textContent = "You found warmth! -10% frost.";
        console.log("Warmth found!");
        item.remove();
        activeItems--;
        updateStats();
        playSound(sounds.warmth); // Play warmth collection sound effect
      };
  }
  // SUMMER
    else if (season === "summer") {
      item.classList.add("summer-item");
      item.textContent = "🌳";

      item.onclick = () => {
        heat = Math.max(0, heat - 10); // Reduces heat by 10%
        messageEl.textContent = "You found shade! -10% heat.";
        console.log("Shade found!");
        item.remove();
        activeItems--;
        updateStats();
        playSound(sounds.wind); // Play wind collection sound effect
      };
    }
  }

  // Position the item randomly on the screen
  item.style.position = "absolute";
  item.style.left = `${Math.random() * 80 + 10}%`; // Avoid edges
  item.style.top = `${Math.random() * 80 + 10}%`;

  document.body.appendChild(item);
  activeItems++;

  // Automatically remove the item after 6 seconds if not clicked
  setTimeout(() => {
    if (document.body.contains(item)) {
      item.remove();
      activeItems--;
    }
  }, 6000);
}

// WALK ACTION: Player walks (slower and safer than running)
function walkAction() {
	console.log("Walk Action Start");
	console.log("[Walk] Before:", { distance, water, heat, frost, season });
	playSound(sounds.walk);

	// Start the game timer on first action
	startTimerIfNeeded();

	// Reset idle timer because player just acted
	secondsSinceLastMove = 0;

	// FALL: No special effects - this is the baseline season for testing
	let distanceGain = 0.1;
	let waterLoss = 1;
	let heatGain = 2;

    // Spawn items randomly
  let spawnChance = 0.3;

  if (season === "spring") spawnChance = 0.4;
  if (season === "summer") spawnChance = 0.2;

  if (Math.random() < spawnChance) {
    spawnItem();
  }

	// SPRING: 20% chance of rain - slows you down but gives water
	if (season === "spring" && Math.random() < 0.2) {
		console.log("[Walk Event Trigger] Spring rain event triggered");
		messageEl.textContent = "Rain slowed you down but gave you water!";
		launchRainEffect();
		distanceGain *= 0.7; // Only gain 0.07 KM instead of 0.1
		water += 1; // But get water back from rain collection
	}

	// WINTER: Cold and snow - uses frost instead of heat
	if (season === "winter") {
		console.log("[Walk Event Trigger] Winter mode active");
		distanceGain *= 0.9; // Snow slows you down slightly
		frost += 2; // Gain frost instead of heat;

		// 30% chance of snowfall event
		if (Math.random() < 0.3) {
			console.log("[Walk Event Trigger] Winter snowfall event triggered");
			messageEl.textContent = "Heavy snow struck!";
			startSnow(); // Show snow visual effect
			launchFrostEffect(); // Show frost pulse effect
			frost += 4; // Extra frost penalty
		}
	}

	// SUMMER: Extra hot and dry - lose more water
	if (season === "summer") {
		console.log("[Walk Event Trigger] Summer mode active");
		heatGain += 1; // Heat builds faster
		waterLoss += 1; // Base water cost goes up

		// 45% chance of heat wave event
		if (Math.random() < 0.45) {
			console.log("[Walk Event Trigger] Summer heat wave event triggered");
			messageEl.textContent = "Heat wave! Extra water loss.";
			launchHeatEffect(); // Show heat pulse effect
			waterLoss += 2; // Severe penalty
			heat += 4; // Big heat spike
		}
	}

	if (season !== "winter") {
		heat += heatGain;
	}

	// Apply heat-based water penalty (only in non-winter seasons)
	let extraWaterLoss = 0;
	if (season !== "winter") {
		extraWaterLoss = getHeatWaterPenalty();
	}

	water -= waterLoss + extraWaterLoss;

	// Apply movement
	distance += distanceGain;

	// Update screen and check for win/lose
	showMilestoneMessage();
	updateStats();
	checkGameState();

	console.log("[Walk] After:", { distance, water, heat, frost, season });
}

// RUN ACTION: Player runs (faster but riskier than walking)
function runAction() {
	console.log("Run Action Start");
	console.log("[Run] Before:", { distance, water, heat, frost, season });
  playSound(sounds.run);

	// Start the game timer on first action
	startTimerIfNeeded();

	// Reset idle timer because player just acted
	secondsSinceLastMove = 0;

	// FALL: No special effects - this is the baseline season for testing
	let distanceGain = 0.2;
	let waterLoss = 3;
	let heatGain = 3.5;

    // Spawn items randomly
  let spawnChance = 0.3;

  if (season === "spring") spawnChance = 0.4;
  if (season === "summer") spawnChance = 0.2;

  if (Math.random() < spawnChance) {
    spawnItem();
  }

	// SPRING: 30% chance of rain - slows your run but gives water
	if (season === "spring" && Math.random() < 0.3) {
		console.log("[Run Event Trigger] Spring rain event triggered");
		messageEl.textContent = "Rain slowed your run!";
		launchRainEffect();
		distanceGain *= 0.7; // Only gain 0.14 KM
		water += 1; // But get water back from rain collection
	}

	// WINTER: Cold and snow - uses frost instead of heat
	if (season === "winter") {
		console.log("[Run Event Trigger] Winter mode active");
		distanceGain *= 0.85; // Snow slows running more than walking
		frost += 3; // Gain frost instead of heat

		// 30% chance of heavy snow event
		if (Math.random() < 0.3) {
			console.log("[Run Event Trigger] Winter heavy snow event triggered");
			messageEl.textContent = "Heavy snow!";
			startSnow(); // Show snow visual effect
			launchFrostEffect(); // Show frost pulse effect
      distanceGain *= 0.7; // Even slower
			frost += 5; // Larger penalty than light snow
		}
	}

	// SUMMER: Extra hot and dry - lose much more water
	if (season === "summer") {
		console.log("[Run Event Trigger] Summer mode active");
		heatGain += 1; // Heat builds very fast
		waterLoss += 1; // Base water cost increases significantly

		// 25% chance of extreme heat wave
		if (Math.random() < 0.25) {
			console.log("[Run Event Trigger] Summer extreme heat wave event triggered");
			messageEl.textContent = "Extreme heat wave!";
			launchHeatEffect(); // Show heat pulse effect
			waterLoss += 2; // Severe penalty
			heat += 3; // Big heat spike
		}
	}

	if (season !== "winter") {
		heat += heatGain;
	}

	// Apply heat-based water penalty (only in non-winter seasons)
	let extraWaterLoss = 0;
	if (season !== "winter") {
		extraWaterLoss = getHeatWaterPenalty();
	}

	water -= waterLoss + extraWaterLoss;

	// Apply movement
	distance += distanceGain;

	// Update screen and check for win/lose
	showMilestoneMessage();
	updateStats();
	checkGameState();

	console.log("[Run] After:", { distance, water, heat, frost, season });
}

// ================================
// EVENT LISTENERS - BUTTON CLICKS
// ================================
// Connect button clicks to the corresponding game actions

walkButton.addEventListener("click", walkAction);
runButton.addEventListener("click", runAction);
resetButton.addEventListener("click", restartGame);
restartButton.addEventListener("click", restartGame);

// ================================
// INITIALIZATION - START THE GAME
// ================================
// Set up the initial display when the page first loads

// Show starting stats on screen
updateStats();

// Load and display any previous leaderboard times
renderLeaderboard();
