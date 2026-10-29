"use strict";

// ========================================
// SECUREKEY - SMART PASSWORD GENERATOR
// ========================================

// 1. Select HTML elements
const passwordInput = document.getElementById("password");
const lengthSlider = document.getElementById("length");
const lengthValue = document.getElementById("length-value");

const uppercaseCheckbox = document.getElementById("uppercase");
const lowercaseCheckbox = document.getElementById("lowercase");
const numbersCheckbox = document.getElementById("numbers");
const symbolsCheckbox = document.getElementById("symbols");

const generateButton = document.getElementById("generate-btn");
const copyButton = document.getElementById("copy-btn");

const strengthText = document.getElementById("strength-text");
const strengthTrack = document.getElementById("strength-track");
const strengthBars = document.querySelectorAll(".strength-bar");

const toast = document.getElementById("toast");

// 2. Define character sets
const characterSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{};:,.?"
};

// 3. Generate a cryptographically secure random integer
function secureRandomInt(max) {
    if (!Number.isSafeInteger(max) || max < 1 || max > 256) {
        throw new Error("Invalid random number range.");
    }

    const range = 256;
    const limit = range - (range % max);
    const randomValues = new Uint8Array(1);

    do {
        crypto.getRandomValues(randomValues);
    } while (randomValues[0] >= limit);

    return randomValues[0] % max;
}

// 4. Shuffle an array using the Fisher-Yates algorithm
function secureShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

// 5. Display an animated notification
let toastTimer;

function showToast(message, isError = false) {
    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// 6. Collect the selected character sets
function getSelectedCharacterSets() {
    const selectedSets = [];

    if (uppercaseCheckbox.checked) {
        selectedSets.push(characterSets.uppercase);
    }

    if (lowercaseCheckbox.checked) {
        selectedSets.push(characterSets.lowercase);
    }

    if (numbersCheckbox.checked) {
        selectedSets.push(characterSets.numbers);
    }

    if (symbolsCheckbox.checked) {
        selectedSets.push(characterSets.symbols);
    }

    return selectedSets;
}

// 7. Generate the password
function generatePassword() {
    const passwordLength = Number(lengthSlider.value);
    const selectedSets = getSelectedCharacterSets();

    // Make sure at least one character type is selected
    if (selectedSets.length === 0) {
        showToast("Select at least one character type.", true);
        return;
    }

    if (!globalThis.crypto ||
        typeof globalThis.crypto.getRandomValues !== "function") {
        showToast("Secure random generation is unavailable.", true);
        return;
    }

    try {
        const allCharacters = selectedSets.join("");
        const passwordCharacters = [];

        // Guarantee at least one character from each selected set
        selectedSets.forEach((set) => {
            passwordCharacters.push(
                set[secureRandomInt(set.length)]
            );
        });

        // Fill the remaining positions
        while (passwordCharacters.length < passwordLength) {
            passwordCharacters.push(
                allCharacters[secureRandomInt(allCharacters.length)]
            );
        }

        // Shuffle to avoid predictable character positions
        secureShuffle(passwordCharacters);

        const password = passwordCharacters.join("");

        passwordInput.value = password;

        updatePasswordStrength(password, selectedSets);

        showToast("Your secure password has been generated!");

    } catch (error) {
        console.error("Password generation failed:", error);
        showToast("Unable to generate a password. Try again.", true);
    }
}

// 8. Estimate password strength
function updatePasswordStrength(password, selectedSets) {
    let score = 0;

    if (password.length >= 12) {
        score++;
    }

    if (password.length >= 16) {
        score++;
    }

    if (selectedSets.length >= 3) {
        score++;
    }

    if (selectedSets.length === 4 && password.length >= 16) {
        score++;
    }

    const labels = [
        "Weak",
        "Fair",
        "Good",
        "Strong",
        "Excellent"
    ];

    const colors = [
        "#ff647c",
        "#ffb454",
        "#ffe66d",
        "#9eea52",
        "#b7ff5a"
    ];

    strengthText.textContent = labels[score];

    strengthBars.forEach((bar, index) => {
        bar.style.background =
            index < score ? colors[score] : "#263247";
    });

    strengthTrack.setAttribute("aria-valuenow", score);
}

// 9. Copy the password to the clipboard
async function copyPassword() {
    const password = passwordInput.value;

    if (!password) {
        showToast("Generate a password first.", true);
        return;
    }

    try {
        if (navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function") {
            await navigator.clipboard.writeText(password);
        } else {
            // Fallback for browsers without Clipboard API support
            const temporaryInput = document.createElement("textarea");

            temporaryInput.value = password;
            temporaryInput.style.position = "fixed";
            temporaryInput.style.opacity = "0";

            document.body.appendChild(temporaryInput);
            temporaryInput.select();

            const copied = document.execCommand("copy");

            temporaryInput.remove();

            if (!copied) {
                throw new Error("Copy command was unsuccessful.");
            }
        }

        copyButton.textContent = "Copied!";
        showToast("Password copied to clipboard!");

        setTimeout(() => {
            copyButton.textContent = "Copy";
        }, 1800);

    } catch (error) {
        console.error("Clipboard operation failed:", error);
        showToast("Copy failed. Please copy the password manually.", true);
    }
}

// 10. Update the displayed password length
function updateLength() {
    lengthValue.value = lengthSlider.value;
    lengthValue.textContent = lengthSlider.value;
}

// 11. Connect buttons and controls to their functions
generateButton.addEventListener("click", generatePassword);

copyButton.addEventListener("click", copyPassword);

lengthSlider.addEventListener("input", updateLength);

// Generate a new password whenever character settings change
[
    uppercaseCheckbox,
    lowercaseCheckbox,
    numbersCheckbox,
    symbolsCheckbox
].forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
        if (passwordInput.value) {
            generatePassword();
        }
    });
});

// 12. Initialize the application
updateLength();
