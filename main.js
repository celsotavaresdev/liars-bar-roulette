
document.addEventListener("DOMContentLoaded", function () {
    const spinSound = document.getElementById("spin-sound");
    const bangSound = document.getElementById("bang-sound");
    const cylinder = document.getElementById("cylinder");
    const message = document.getElementById("message");
    const spinButton = document.getElementById("spin-button");
    const fireButton = document.getElementById("fire-button");
    const counter = document.getElementById("counter");
    const redOverlay = document.getElementById("red-overlay");

    const heartbeatPulses = document.querySelectorAll(".heartbeat-pulse");

    // Apple devices are kinda dumb
    const clickSound1 = document.getElementById("click-sound");
    const clickSound2 = document.getElementById("click-sound1");
    const clickSound3 = document.getElementById("click-sound2");
    const clickSound4 = document.getElementById("click-sound3");
    const clickSound5 = document.getElementById("click-sound4");
    const clickSound6 = document.getElementById("click-sound5");

    const chambersNodeList = document.querySelectorAll(".chamber");
    const chambers = Array.from(chambersNodeList).sort((a, b) => {
        // Extract the chamber number from the class name
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

    redOverlay.style.opacity = "1";
    redOverlay.style.visibility = "visible";

    let isSpinning = false;
    let loadedChamber = null;
    let currentChamber = 0;
    let attempts = 0;
    let gameStarted = false;
    let isSpun = false;
    let totalRotation = 0;

    // Reset sounds function (in case of quick successive plays)
    function resetSound(sound) {
        sound.pause();
        sound.currentTime = 0;
        sound.volume = 0.4;
    }

    chambers.forEach((chamber, index) => {
        chamber.addEventListener("click", function () {
            if (gameStarted || isSpinning) return;

            // Load the bullet in clicked chamber
            const bullet = this.querySelector(".bullet");
            bullet.classList.add("loaded");
            loadedChamber = index;
            gameStarted = true;

            // Show spin button
            spinButton.style.visibility = "visible";
            message.textContent = "Spin the cylinder";
        });
    });

    /* Spin Button */

    spinButton.addEventListener("click", function () {
        if (isSpinning || isSpun) return;

        isSpinning = true;
        cylinder.classList.add("spinning");
        spinButton.style.visibility = "hidden";
        message.textContent = "Spinning...";

        resetSound(spinSound);
        spinSound.play();

        // Add question marks to all chambers
        chambers.forEach((chamber) => {
            chamber.classList.add("unknown");
            chamber.querySelector(".bullet").classList.add("unknown");
            chamber.querySelector(".bullet").classList.remove("loaded");
        });

        setTimeout(() => {
            cylinder.classList.remove("spinning");
            isSpinning = false;
            isSpun = true;

            // Use weighted spin function
            const targetChamber = getWeightedSpinResult(loadedChamber);
            const spins = (targetChamber - loadedChamber + 6) % 6;
            loadedChamber = targetChamber;
            currentChamber = 0;

            fireButton.style.visibility = "visible";
            message.textContent = "Pull the trigger";
            counter.textContent = "0/6";
        }, 2000);
    });

    /* Fire Button */

    let currentClickSound = 1;

    fireButton.addEventListener("click", function () {
        message.textContent = "      ";
        if (isSpinning) return;
        isSpinning = true;

        totalRotation += 60;
        cylinder.style.transform = `rotate(${totalRotation}deg)`;
        attempts++;
        counter.textContent = `${attempts}/6`;

        // Remove the final-bullet class from all chambers first
        chambers.forEach((chamber) => {
            chamber.classList.remove("final-bullet");
        });

        setTimeout(() => {
            if (currentChamber === loadedChamber) {

                // Remove bullets
                chambers.forEach((chamber) => {
                    chamber.classList.remove("unknown");
                    chamber.querySelector(".bullet").classList.remove("unknown");
                    chamber.querySelector(".bullet").classList.remove("loaded");
                });

                // Bang!
                resetSound(bangSound);
                bangSound.play();

                heartbeatPulses.forEach((pulse) => {
                    pulse.classList.remove("active");
                });

                message.textContent = "BANG!";
                cylinder.classList.add("game-over");
                fireButton.style.visibility = "hidden";
                redOverlay.classList.add("show");
            } else {
                const clickSoundElement = document.getElementById(`click-sound${currentClickSound}`);
                resetSound(clickSoundElement);
                clickSoundElement.play();

                // Increment the click sound counter (1 through 6)
                currentClickSound = (currentClickSound % 6) + 1;

                // Remove bullet class from current chamber
                chambers[currentChamber].querySelector(".bullet").classList.remove("loaded");
                chambers[currentChamber].querySelector(".bullet").classList.remove("unknown");
                chambers[currentChamber].classList.remove("unknown");

                message.textContent = "*click*";
                currentChamber = (currentChamber + 1) % 6;
                isSpinning = false;
            }
        }, 500);

        // Check if this is the second-to-last attempt (5th shot)
        if (attempts === 5 && loadedChamber === 5) {
            // We know the next chamber is the final one, so mark it
            const nextChamber = chambers[(currentChamber + 1) % 6];
            nextChamber.classList.add("final-bullet");

            heartbeatPulses.forEach((pulse) => {
                pulse.classList.add("active");
            });
        } else if (attempts < 5) {
            // Make sure to remove the effect if we're not on the final chamber
            heartbeatPulses.forEach((pulse) => {
                pulse.classList.remove("active");
            });
        }
    });
});

function getWeightedSpinResult(initialChamber) {
    // Define weights for each chamber (1-6)
    // The weights are relative probabilities
    const weights = {
        1: 0.1, // Least likely
        2: 0.2,
        3: 0.2,
        4: 0.2,
        5: 0.15,
        6: 0.15,
    };

    // Add a slight bias based on initial chamber position
    // This creates a subtle tendency to land closer to the starting position
    const biasedWeights = { ...weights };
    const maxBias = 0.05; // Maximum bias amount

    // Apply distance-based bias
    Object.keys(biasedWeights).forEach((chamber) => {
        const distance = Math.abs(initialChamber - parseInt(chamber));
        const adjustedDistance = Math.min(distance, 6 - distance); // Account for circular nature
        const bias = maxBias * (1 - adjustedDistance / 3); // Linear falloff
        biasedWeights[chamber] += bias;
    });

    // Normalize weights to ensure they sum to 1
    const totalWeight = Object.values(biasedWeights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(biasedWeights).forEach((chamber) => {
        biasedWeights[chamber] /= totalWeight;
    });

    // Convert weights to cumulative probabilities
    let cumulative = 0;
    const cumulativeWeights = {};
    Object.keys(biasedWeights).forEach((chamber) => {
        cumulative += biasedWeights[chamber];
        cumulativeWeights[chamber] = cumulative;
    });

    // Generate random number and find corresponding chamber
    const random = Math.random();
    for (const [chamber, weight] of Object.entries(cumulativeWeights)) {
        if (random <= weight) {
            return parseInt(chamber) - 1; // Convert to 0-based index
        }
    }

    return 5; // Fallback to last chamber (should never reach here)
}