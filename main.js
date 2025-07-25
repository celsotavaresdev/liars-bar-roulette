
document.addEventListener("DOMContentLoaded", function () {
    const spinSound = document.getElementById("spin-sound");
    const bangSound = document.getElementById("bang-sound");
    const cylinder = document.getElementById("cylinder");
    const cylinderWrapper = cylinder.parentElement; 
    const message = document.getElementById("message");
    const spinButton = document.getElementById("spin-button");
    const fireButton = document.getElementById("fire-button");
    const counter = document.getElementById("counter");
    const redOverlay = document.getElementById("red-overlay");
    const startButton = document.getElementById("start-button"); 
    const gameContainer = document.getElementById("game-container");
    const playerSetupContainer = document.getElementById("player-setup-container");
    const playerNameInput = document.getElementById("player-name-input");
    const addPlayerButton = document.getElementById("add-player-button");
    const playerListElement = document.getElementById("player-list");
    const playerScoreContainer = document.getElementById("player-score-container");
    const playerScoreListElement = document.getElementById("player-score-list");
    const continueGameButton = document.getElementById("continue-game-button");
    const newGameButton = document.getElementById("new-game-button");
    const backToPlayersButton = document.getElementById("back-to-players-button"); 
    
    let bloodSplatterContainer = document.getElementById("blood-splatter-container"); 

    const heartbeatPulses = document.querySelectorAll(".heartbeat-pulse");

    const clickSounds = [
        document.getElementById("click-sound"),
        document.getElementById("click-sound1"),
        document.getElementById("click-sound2"),
        document.getElementById("click-sound3"),
        document.getElementById("click-sound4"),
        document.getElementById("click-sound5")
    ];
    const cardFlipSound = document.getElementById("card-flip-sound");

    const chambersNodeList = document.querySelectorAll(".chamber");
    const chambers = Array.from(chambersNodeList).sort((a, b) => {
        const getNumber = (el) => {
            const classes = el.className.split(" ");
            const numberClass = classes.find((c) => ["one", "two", "three", "four", "five", "six"].includes(c));
            const numbers = {
                one: 1,
                two: 2,
                three: 3,
                four: 4,
                five: 5,
                six: 6,
            };
            return numbers[numberClass];
        };
        return getNumber(a) - getNumber(b);
    });

    let isSpinning = false;
    let loadedChamber = null;
    let currentChamber = 0;
    let attempts = 0;
    let gameStarted = false;
    let isSpun = false; 
    let totalRotation = 0;

    let players = []; 
    let activePlayers = []; 
    let currentPlayer = null; 

    const MAX_PLAYERS = 4;

    // Card reveal elements
    const mainGameContentWrapper = document.getElementById("main-game-content-wrapper"); // Get the new wrapper
    const cardRevealContainer = document.getElementById("card-reveal-container");
    const topCardElement = document.getElementById("top-card");
    const cardBackElement = topCardElement.querySelector(".card-back");
    const cardMessage = document.getElementById("card-message");
    let isCardRevealing = false; // Flag to prevent multiple clicks during flip
    let revealedCard = null; // Stores the revealed card for the current game session

    function resetSound(sound) {
        if (sound) { 
            sound.pause();
            sound.currentTime = 0;
            sound.volume = 0.4;
        }
    }

    function addPlayer() {
        const name = playerNameInput.value.trim();
        if (!name) {
            alert("Player name cannot be empty.");
            return;
        }
        if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) { 
            alert("Player with this name already exists.");
            return;
        }
        if (players.length >= MAX_PLAYERS) {
            alert("Maximum 4 players allowed."); 
            return;
        }

        players.push({
            name: name,
            alive: true,
            attempts: 0,
            loadedChamber: null,
            currentChamber: 0,
            totalRotation: 0,
            isSpun: false, 
            victories: 0 
        });
        playerNameInput.value = "";
        updatePlayerListDisplay();
        checkStartButtonStatus();
        updatePlayerInputAndAddButtonStatus(); 
    }

    function removePlayer(nameToRemove) {
        players = players.filter(player => player.name !== nameToRemove);
        updatePlayerListDisplay();
        checkStartButtonStatus();
        updatePlayerInputAndAddButtonStatus(); 
    }

    function updatePlayerListDisplay() {
        playerListElement.innerHTML = "";
        players.forEach(player => {
            const listItem = document.createElement("li");
            listItem.textContent = player.name;
            const removeButton = document.createElement("button");
            removeButton.textContent = "X";
            removeButton.classList.add("remove-player");
            removeButton.onclick = () => removePlayer(player.name);
            listItem.appendChild(removeButton);
            playerListElement.appendChild(listItem);
        });
    }

    function checkStartButtonStatus() {
        startButton.disabled = players.length < 2;
    }

    function updatePlayerInputAndAddButtonStatus() {
        const currentName = playerNameInput.value.trim();
        const isDuplicate = players.some(p => p.name.toLowerCase() === currentName.toLowerCase());
        const isMaxPlayers = players.length >= MAX_PLAYERS;

        if (isMaxPlayers) {
            playerNameInput.disabled = true;
            addPlayerButton.disabled = true;
            playerNameInput.placeholder = "Max players reached";
        } else {
            playerNameInput.disabled = false;
            playerNameInput.placeholder = "Enter player name";
            addPlayerButton.disabled = !currentName || isDuplicate;
        }
    }

    function startGame() {
        playerSetupContainer.style.display = "none";
        mainGameContentWrapper.style.display = "flex"; // Show the new wrapper
        activePlayers = players.filter(p => p.alive); 
        resetAllPlayerRoulettes(); 
        updatePlayerScoreListDisplay();
        showCardRevealPhase(); // Start with card reveal phase
    }

    function updatePlayerScoreListDisplay() {
        playerScoreListElement.innerHTML = "";
        const cardIsRevealed = revealedCard !== null; // Check card state once

        players.forEach(player => {
            const listItem = document.createElement("li");
            listItem.textContent = `${player.name}`; 
            const statusSpan = document.createElement("span");
            statusSpan.classList.add("status");

            statusSpan.textContent = `Wins: ${player.victories}`; // Display wins
            listItem.appendChild(statusSpan); // Append status span to list item

            if (!player.alive) {
                listItem.classList.add("eliminated");
            } else {
                listItem.classList.remove("eliminated"); // Ensure not eliminated
                // Apply disabled-click based on card revealed state
                if (!cardIsRevealed) {
                    listItem.classList.add("disabled-click");
                } else {
                    listItem.classList.remove("disabled-click");
                }
                listItem.addEventListener("click", () => selectPlayerForRoulette(player));
            }
            playerScoreListElement.appendChild(listItem);
        });
    }

    function enablePlayerClicks() {
        playerScoreListElement.querySelectorAll("li").forEach(item => {
            if (!item.classList.contains("eliminated")) {
                item.classList.remove("disabled-click");
            }
        });
    }

    function disablePlayerClicks() {
        playerScoreListElement.querySelectorAll("li").forEach(item => {
            item.classList.add("disabled-click");
        });
    }

    function showCardRevealPhase() {
        playerScoreContainer.style.display = "flex"; // Show player score list
        cardRevealContainer.style.display = "flex"; // Show card reveal container
        gameContainer.style.display = "none"; // Hide game roulette
        
        topCardElement.classList.remove("flipped"); // Ensure card is face down
        cardBackElement.textContent = ""; // Clear previous card value
        cardMessage.textContent = ""; // Clear card message text

        if (revealedCard) {
            // If a card is already revealed for this game, show it immediately
            cardBackElement.textContent = revealedCard;
            topCardElement.classList.add("flipped");
            enablePlayerClicks(); // Enable clicks immediately
        } else {
            // Otherwise, keep card face down and disable clicks until revealed
            disablePlayerClicks(); 
        }
    }

    function revealCard() {
        if (isCardRevealing || topCardElement.classList.contains("flipped")) {
            return; // Prevent multiple flips or flipping an already flipped card
        }
        isCardRevealing = true;

        resetSound(cardFlipSound);
        cardFlipSound.play().catch(error => {
            if (error.name === 'AbortError') {
                console.log('Audio playback aborted (likely by a quick pause/reset). This is often harmless.');
            } else {
                console.error('Error playing sound:', error);
            }
        });

        topCardElement.classList.add("flipped");

        if (!revealedCard) { // Generate a new card only if not already revealed for this game
            const cards = ['Q', 'K', 'A'];
            revealedCard = cards[Math.floor(Math.random() * cards.length)];
        }
        cardBackElement.textContent = revealedCard;

        setTimeout(() => {
            isCardRevealing = false;
            updatePlayerScoreListDisplay(); // Call update to ensure correct click state
            enablePlayerClicks(); // Enable player clicks after card is revealed
        }, 600); // Match CSS transition duration
    }

    topCardElement.addEventListener("click", revealCard);


    function selectPlayerForRoulette(player) {
        // Find the specific list item for the player
        let playerListItem = null;
        for (let i = 0; i < playerScoreListElement.children.length; i++) {
            const item = playerScoreListElement.children[i];
            // Check if the text content starts with the player's name
            // This is a safer check than .includes() to avoid partial matches
            if (item.textContent.startsWith(player.name)) { 
                playerListItem = item;
                break;
            }
        }

        if (!player.alive || (playerListItem && playerListItem.classList.contains("disabled-click"))) {
            return; // Prevent selection if player is eliminated or clicks are disabled
        }

        currentPlayer = player;
        mainGameContentWrapper.style.display = "none"; // Hide the new wrapper
        gameContainer.style.display = "flex"; // Show game roulette

        loadedChamber = currentPlayer.loadedChamber;
        currentChamber = currentPlayer.currentChamber;
        totalRotation = currentPlayer.totalRotation;
        isSpun = currentPlayer.isSpun; 
        attempts = currentPlayer.attempts;

        updateRouletteVisuals();

        counter.textContent = `${currentPlayer.attempts}/6`;

        // Reset button states
        spinButton.classList.remove("show-button");
        fireButton.classList.remove("show-button");
        fireButton.disabled = true; // Always disable fire button initially

        if (!currentPlayer.isSpun) {
            spinButton.classList.add("show-button"); // Show spin button with fade
            message.innerHTML = `It's ${currentPlayer.name}'s turn<br>Spin the cylinder`; 
        } else {
            fireButton.classList.add("show-button"); // Show fire button with fade
            fireButton.disabled = false; 
            message.innerHTML = `It's ${currentPlayer.name}'s turn<br>Pull the trigger`; 
        }
    }

    function updateRouletteVisuals() {
        cylinderWrapper.style.transform = `scale(var(--cylinder-scale)) rotate(${currentPlayer.totalRotation}deg)`; 

        chambers.forEach((chamber, index) => {
            const bullet = chamber.querySelector(".bullet");
            chamber.classList.remove("unknown", "final-bullet");
            bullet.classList.remove("unknown", "loaded"); // Remove all bullet-related classes first

            if (!currentPlayer.isSpun) {
                // Before spin: only the loaded chamber shows the bullet in original color
                if (index === currentPlayer.loadedChamber) {
                    bullet.classList.add("loaded"); // This will make it visible and apply original color
                }
            } else {
                // After spin: all chambers are "unknown", and bullets are dark gray
                chamber.classList.add("unknown"); // This adds the '?'
                bullet.classList.add("unknown"); // This makes the bullet visible and dark gray
                
                // Logic to reveal previously fired chambers
                for (let i = 0; i < currentPlayer.attempts; i++) {
                    const firedChamberIndex = (currentPlayer.currentChamber - 1 - i + 6) % 6;
                    chambers[firedChamberIndex].classList.remove("unknown"); // Remove '?'
                    chambers[firedChamberIndex].querySelector(".bullet").classList.remove("unknown"); // Revert bullet to original color (or hide if not loaded)
                    // If it was the loaded chamber and it was fired, it should show the bullet in original color
                    if (firedChamberIndex === currentPlayer.loadedChamber) {
                        chambers[firedChamberIndex].querySelector(".bullet").classList.add("loaded");
                    }
                }

                if (currentPlayer.attempts === 5 && currentPlayer.currentChamber === currentPlayer.loadedChamber) {
                    chambers[currentPlayer.loadedChamber].classList.add("final-bullet");
                }
            }
        });
    }

    function spinCylinder() {
        if (isSpinning || currentPlayer.isSpun) {
            return;
        }

        isSpinning = true;
        cylinderWrapper.classList.add("spinning");
        spinButton.classList.remove("show-button"); // Fade out spin button
        message.innerHTML = `It's ${currentPlayer.name}'s turn<br>Spinning...`;

        resetSound(spinSound);
        spinSound.play().catch(error => {
            if (error.name === 'AbortError') {
                console.log('Audio playback aborted (likely by a quick pause/reset). This is often harmless.');
            } else {
                console.error('Error playing sound:', error);
            }
        });

        chambers.forEach((chamber) => {
            chamber.classList.add("unknown"); // Add '?'
            chamber.querySelector(".bullet").classList.add("unknown"); // Make bullet dark gray
            chamber.querySelector(".bullet").classList.remove("loaded"); // Ensure 'loaded' style is removed during spin
        });

        setTimeout(() => {
            cylinderWrapper.classList.remove("spinning");
            isSpinning = false;
            currentPlayer.isSpun = true; 

            const targetChamber = getWeightedSpinResult(currentPlayer.loadedChamber);
            currentPlayer.loadedChamber = targetChamber; 
            loadedChamber = targetChamber; 
            currentChamber = 0; 

            fireButton.classList.add("show-button"); // Fade in fire button
            fireButton.disabled = false; 
            message.innerHTML = `It's ${currentPlayer.name}'s turn<br>Pull the trigger`; 
            counter.textContent = `${currentPlayer.attempts}/6`;
        }, 2000);
    }

    spinButton.addEventListener("click", function() {
        spinCylinder();
    });


    let currentClickSoundIndex = 0; 

    fireButton.addEventListener("click", function () {
        fireButton.classList.remove("show-button"); // Fade out fire button
        fireButton.disabled = true; 
        
        message.innerHTML = `It's ${currentPlayer.name}'s turn<br>...`; // Temporarily show dots
        if (isSpinning) return;
        isSpinning = true;

        const firedChamberIndex = currentChamber; 

        currentPlayer.totalRotation += 60; 
        totalRotation = currentPlayer.totalRotation; 
        
        cylinderWrapper.style.transform = `scale(var(--cylinder-scale)) rotate(${totalRotation}deg)`;

        currentPlayer.attempts++; 
        attempts = currentPlayer.attempts; 
        counter.textContent = `${attempts}/6`;

        chambers.forEach((chamber) => {
            chamber.classList.remove("final-bullet");
        });

        chambers[firedChamberIndex].classList.remove("unknown");
        chambers[firedChamberIndex].querySelector(".bullet").classList.remove("unknown");
        chambers[firedChamberIndex].querySelector(".bullet").classList.remove("loaded");


        setTimeout(() => { 
            if (firedChamberIndex === loadedChamber) { 
                chambers.forEach((chamber) => {
                    chamber.classList.remove("unknown");
                    chamber.querySelector(".bullet").classList.remove("unknown");
                    chamber.querySelector(".bullet").classList.remove("loaded");
                });
                
                resetSound(bangSound);
                bangSound.play().catch(error => {
                    if (error.name === 'AbortError') {
                        console.log('Audio playback aborted (likely by a quick pause/reset).');
                    } else {
                        console.error('Error playing sound:', error);
                    }
                });
                message.innerHTML = `It's ${currentPlayer.name}'s turn<br>*bang!*`; 

                createBloodSplatters(); 

                heartbeatPulses.forEach((pulse) => {
                    pulse.classList.remove("active");
                });

                currentPlayer.alive = false; 
                
                cylinderWrapper.classList.add("game-over");
                
                activePlayers = players.filter(p => p.alive); 

                // Update player scores and display before showing the overlay
                updatePlayerScoreListDisplay(); 

                redOverlay.classList.add("show");
                if (activePlayers.length <= 1) { 
                    continueGameButton.style.display = 'block'; 
                    newGameButton.style.display = 'block';
                    backToPlayersButton.style.display = 'none'; 
                    if (activePlayers.length === 1) {
                        activePlayers[0].victories++; 
                        redOverlay.querySelector(".game-over-text").innerHTML = `${activePlayers[0].name}<br>WON!`;
                    } else {
                        redOverlay.querySelector(".game-over-text").textContent = "ALL ELIMINATED!";
                    }
                } else { 
                    redOverlay.querySelector(".game-over-text").innerHTML = `${currentPlayer.name}<br>is dead`; 
                    continueGameButton.style.display = 'none'; 
                    newGameButton.style.display = 'none';
                    backToPlayersButton.style.display = 'block'; 
                }

            } else {
                const clickSoundElement = clickSounds[currentClickSoundIndex]; 
                resetSound(clickSoundElement);
                clickSoundElement.play().catch(error => {
                    if (error.name === 'AbortError') {
                        console.log('Audio playback aborted (likely by a quick pause/reset).');
                    } else {
                        console.error('Error playing sound:', error);
                    }
                });

                currentClickSoundIndex = (currentClickSoundIndex + 1) % clickSounds.length;

                message.innerHTML = `It's ${currentPlayer.name}'s turn<br>*click*`; 
                currentChamber = (currentChamber + 1) % 6;
                currentPlayer.currentChamber = currentChamber; 
                isSpinning = false;

                setTimeout(() => {
                    clearBloodSplatters(); 
                    gameContainer.style.display = "none";
                    mainGameContentWrapper.style.display = "flex"; // Go back to main game content wrapper
                    fireButton.disabled = false; 
                    updatePlayerScoreListDisplay(); // Update after a non-fatal shot
                    enablePlayerClicks(); // Re-enable player clicks after a non-fatal shot
                }, 1000); 
            }
        }, 500);

        if (attempts === 5 && loadedChamber === 5) {
            const nextChamber = chambers[(currentChamber + 1) % 6];
            nextChamber.classList.add("final-bullet");

            heartbeatPulses.forEach((pulse) => {
                pulse.classList.add("active");
            });
        } else if (attempts < 5) {
            heartbeatPulses.forEach((pulse) => {
                pulse.classList.remove("active");
            });
        }
    });

    addPlayerButton.addEventListener("click", addPlayer);
    playerNameInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            addPlayer();
        }
    });
    playerNameInput.addEventListener("input", updatePlayerInputAndAddButtonStatus);


    startButton.addEventListener("click", startGame);

    continueGameButton.addEventListener("click", function() {
        redOverlay.classList.remove("show"); 
        setTimeout(() => {
            players.forEach(player => {
                player.alive = true;
            });
            activePlayers = players.filter(p => p.alive); 

            resetAllPlayerRoulettes(); 
            revealedCard = null; // Reset revealed card on continue
            mainGameContentWrapper.style.display = "flex"; // Show the new wrapper
            gameContainer.style.display = "none"; // Hide game roulette
            showCardRevealPhase(); // Show card reveal phase, will now require click to reveal
            isSpinning = false; 
            gameStarted = true; 
            clearBloodSplatters(); 
            cylinderWrapper.classList.remove("game-over"); 
            updatePlayerScoreListDisplay(); // Update on continue game
        }, 300); 
    });

    newGameButton.addEventListener("click", function() {
        redOverlay.classList.remove("show"); 
        setTimeout(() => {
            // Reset all game state variables
            players = [];
            activePlayers = [];
            currentPlayer = null;
            loadedChamber = null;
            currentChamber = 0;
            attempts = 0;
            gameStarted = false;
            isSpun = false; 
            totalRotation = 0;
            isSpinning = false; 
            isCardRevealing = false; 
            revealedCard = null; // Reset revealed card for a truly new game

            // Reset display elements
            gameContainer.style.display = "none";
            mainGameContentWrapper.style.display = "none"; // Hide the new wrapper
            playerSetupContainer.style.display = "flex";
            
            // Reset cylinder visual state
            cylinderWrapper.classList.remove("spinning", "game-over");
            cylinderWrapper.style.transform = `scale(var(--cylinder-scale)) rotate(0deg)`;
            chambers.forEach((chamber) => {
                chamber.classList.remove("unknown", "final-bullet");
                chamber.querySelector(".bullet").classList.remove("unknown", "loaded");
            });
            clearBloodSplatters(); 

            // Reset message and counter
            message.textContent = "Load a bullet..."; 
            counter.textContent = ""; 

            // Reset button visibility and disabled states
            spinButton.classList.remove("show-button");
            fireButton.classList.remove("show-button");
            fireButton.disabled = true; 

            // Reset card visual state
            topCardElement.classList.remove("flipped");
            cardBackElement.textContent = "";
            cardMessage.textContent = ""; // Ensure card message is clear

            // Update player setup UI
            updatePlayerListDisplay();
            checkStartButtonStatus();
            updatePlayerInputAndAddButtonStatus(); 
        }, 300); 
    });

    backToPlayersButton.addEventListener("click", function() {
        redOverlay.classList.remove("show"); 
        setTimeout(() => {
            clearBloodSplatters(); 
            cylinderWrapper.classList.remove("game-over"); 
            gameContainer.style.display = "none";
            mainGameContentWrapper.style.display = "flex"; // Go back to main game content wrapper
            showCardRevealPhase(); // Go back to card reveal phase, will display existing revealedCard
            isSpinning = false; 
            fireButton.disabled = true; 
            updatePlayerScoreListDisplay(); // Update on back to players
        }, 300); 
    });

    function resetAllPlayerRoulettes() {
        players.forEach(player => { 
            player.loadedChamber = 5; 
            player.currentChamber = 0;
            player.attempts = 0;
            player.isSpun = false; 
            player.totalRotation = 0;
        });
        chambers.forEach((chamber) => {
            chamber.classList.remove("unknown", "final-bullet");
            chamber.querySelector(".bullet").classList.remove("unknown", "loaded");
        });
        cylinderWrapper.style.transform = `scale(var(--cylinder-scale)) rotate(0deg)`;
    }


    function getWeightedSpinResult(initialChamber) {
        const weights = {
            1: 0.1, 
            2: 0.2,
            3: 0.2,
            4: 0.2,
            5: 0.15,
            6: 0.15,
        };

        const biasedWeights = { ...weights };
        const maxBias = 0.05; 

        Object.keys(biasedWeights).forEach((chamber) => {
            const distance = Math.abs(initialChamber - parseInt(chamber));
            const adjustedDistance = Math.min(distance, 6 - distance); 
            const bias = maxBias * (1 - adjustedDistance / 3); 
            biasedWeights[chamber] += bias;
        });

        const totalWeight = Object.values(biasedWeights).reduce((sum, weight) => sum + weight, 0);
        Object.keys(biasedWeights).forEach((chamber) => {
            biasedWeights[chamber] /= totalWeight;
        });

        let cumulative = 0;
        const cumulativeWeights = {};
        Object.keys(biasedWeights).forEach((chamber) => {
            cumulative += biasedWeights[chamber];
            cumulativeWeights[chamber] = cumulative;
        });

        const random = Math.random();
        for (const [chamber, weight] of Object.entries(cumulativeWeights)) {
            if (random <= weight) {
                return parseInt(chamber) - 1; 
            }
        }

        return 5; 
    }

    function createBloodSplatters() {
        if (!bloodSplatterContainer) {
            bloodSplatterContainer = document.createElement('div');
            bloodSplatterContainer.id = 'blood-splatter-container';
            document.body.appendChild(bloodSplatterContainer);
        }
        bloodSplatterContainer.style.display = 'block'; 

        const numSplatters = Math.floor(Math.random() * 5) + 6;
        let largeSplatCount = 0;
        let splat1Count = 0;
        let largeSplat1Exists = false;

        const sectors = [
            { x: [0, 50], y: [0, 50], used: 0 },      
            { x: [50, 100], y: [0, 50], used: 0 },    
            { x: [0, 50], y: [50, 100], used: 0 },    
            { x: [50, 100], y: [50, 100], used: 0 }   
        ];

        function getPositionInSector(sector, size) {
            const sizePercentage = (size / window.innerWidth) * 100;
            const padding = sizePercentage / 2;
            
            const xMin = Math.max(sector.x[0] + padding, sector.x[0]);
            const xMax = Math.min(sector.x[1] - padding, sector.x[1]);
            const yMin = Math.max(sector.y[0] + padding, sector.y[0]);
            const yMax = Math.min(sector.y[1] - padding, sector.y[1]);
            
            return {
                x: xMin + (Math.random() * (xMax - xMin)),
                y: yMin + (Math.random() * (yMax - yMin)) 
            };
        }

        function selectSector(size) {
            const isLarge = size > 200;
            
            if (isLarge) {
                const availableSectors = sectors
                    .filter(s => s.used < 3) 
                    .sort((a, b) => a.used - b.used);
                
                if (availableSectors.length > 0) { 
                    const selectedSector = availableSectors[0]; 
                    selectedSector.used++;
                    return selectedSector;
                }
            }
            
            const totalWeight = sectors.reduce((sum, sector) => sum + (4 - sector.used), 0); 
            let random = Math.random() * totalWeight;
            
            for (const sector of sectors) {
                const weight = 4 - sector.used;  
                if (random <= weight) {
                    sector.used++;
                    return sector;
                }
                random -= weight;
            }
            
            return sectors[Math.floor(Math.random() * sectors.length)];
        }

        for (let i = 0; i < numSplatters; i++) {
            const splatter = document.createElement('img');
            
            let size;
            const sizeRoll = Math.random();
            
            if (largeSplatCount < 3 && sizeRoll > 0.6) {
                size = 200 + Math.random() * 150;
                largeSplatCount++;
            } else {
                size = largeSplatCount >= 2 ? 
                        (30 + Math.random() * 100) : 
                        (50 + Math.random() * 130);
            }

            let splatterNum;
            if (size > 200) {
                if (splat1Count === 0 && Math.random() > 0.5) {
                    splatterNum = 1;
                    splat1Count++;
                    largeSplat1Exists = true;
                } else {
                    splatterNum = Math.random() < 0.5 ? 2 : 3;
                }
            } else {
                if (splat1Count < 2 && !largeSplat1Exists && Math.random() > 0.7) {
                    splatterNum = 1;
                    splat1Count++;
                } else if (splat1Count < 1 && Math.random() > 0.5) { 
                    splatterNum = 1;
                    splat1Count++;
                } else {
                    splatterNum = Math.random() < 0.5 ? 2 : 3;
                }
            }

            splatter.src = `img/splat${splatterNum}.svg`;
            
            const sector = selectSector(size);
            const position = getPositionInSector(sector, size);
            
            splatter.style.position = 'fixed';
            splatter.style.left = `${position.x}%`;
            splatter.style.top = `${position.y}%`;
            
            splatter.style.width = `${size}px`;
            splatter.style.height = `${size}px`;
            
            let rotation;
            if (splatterNum === 1) {
                rotation = (Math.random() * 40) - 20;
            } else {
                rotation = Math.random() * 360;
            }
            
            splatter.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            
            const baseOpacity = 0.3 + Math.random() * 0.4;
            splatter.style.opacity = size > 200 ? 
                                    Math.min(baseOpacity * 1.2, 0.85) : 
                                    baseOpacity;
            
            splatter.style.pointerEvents = 'none';
            splatter.style.filter = 'brightness(0.8)';
            
            bloodSplatterContainer.appendChild(splatter);
        }
    }

    function clearBloodSplatters() {
        if (bloodSplatterContainer) {
            bloodSplatterContainer.innerHTML = ''; 
            bloodSplatterContainer.style.display = 'none'; 
        }
    }

    updatePlayerInputAndAddButtonStatus();
});
