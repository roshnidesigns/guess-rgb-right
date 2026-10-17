// Guess RGB Right: match the RGB value to the right color box.
// Normal mode: one color at a time. Rush mode: as many as you can in RUSH_SECONDS.

const boxes = document.querySelectorAll(".box");
const promptText = document.getElementById("prompt");
const rgb = document.getElementById("rgb");
const message = document.getElementById("message");
const mainButton = document.getElementById("new-colors");
const easy = document.getElementById("easy");
const hard = document.getElementById("hard");
const rushToggle = document.getElementById("rush");
const hud = document.getElementById("hud");
const timeText = document.getElementById("time");
const scoreText = document.getElementById("score");

const RUSH_SECONDS = 30;
const PROMPT = "Can you guess this color?";

let count = 6; // boxes in play: 3 for easy, 6 for hard
let goal; // the winning color, as "rgb(r, g, b)"
let locked = false; // true while box clicks should be ignored

let rush = false; // rush mode switched on
let running = false; // a rush run is in progress
let score = 0;
let deadline; // when the current rush run ends (ms timestamp)
let timer;

function randomColor() {
    const channel = () => Math.floor(Math.random() * 256);
    return `rgb(${channel()}, ${channel()}, ${channel()})`;
}

// true when beige text reads better than dark text on this color (WCAG relative luminance)
function isDark(color) {
    const [r, g, b] = color.match(/\d+/g).map((c) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18;
}

// best rush score for this browser tab session, kept per difficulty and run length
function bestKey() {
    return `best-${count}-${RUSH_SECONDS}`;
}

function getBest() {
    try {
        return Number(sessionStorage.getItem(bestKey())) || 0;
    } catch {
        return 0;
    }
}

function setBest(n) {
    try {
        sessionStorage.setItem(bestKey(), n);
    } catch {}
}

// fresh set of colors and a new goal
function deal() {
    const colors = Array.from({ length: count }, randomColor);
    goal = colors[Math.floor(Math.random() * count)];

    rgb.textContent = goal.replace("(", " ("); // "rgb (r, g, b)" reads better big
    message.textContent = "";
    document.body.style.backgroundColor = "";
    document.body.classList.remove("dark");

    boxes.forEach((box, i) => {
        box.style.backgroundColor = colors[i] || "";
        box.style.display = colors[i] ? "" : "none";
        box.style.opacity = "";
    });
}

// ---- normal mode ----

function newRound() {
    deal();
    locked = false;
    promptText.textContent = PROMPT;
    mainButton.textContent = "NEW COLORS";
}

function win() {
    locked = true;
    promptText.textContent = "You guessed it right AMAZING DUDE!!";
    message.textContent = "CORRECT! ^-^";
    mainButton.textContent = "AGAIN?";
    document.body.style.backgroundColor = goal;
    document.body.classList.toggle("dark", isDark(goal));
    boxes.forEach((box) => (box.style.backgroundColor = "var(--beige)"));
}

// ---- rush mode ----

// timer and score row between the color grid and the buttons
function showHud(seconds) {
    timeText.textContent = seconds;
    scoreText.textContent = `Score ${score}`;
}

// before a run: show the colors but wait for START
function rushReady() {
    deal();
    locked = true;
    score = 0;
    showHud(RUSH_SECONDS);
    promptText.textContent = PROMPT;
    message.textContent = `BEST ${getBest()}`;
    mainButton.textContent = "START";
}

function startRush() {
    running = true;
    locked = false;
    score = 0;
    deadline = Date.now() + RUSH_SECONDS * 1000;
    deal();
    mainButton.textContent = "SKIP";
    tick();
    timer = setInterval(tick, 100);
}

function tick() {
    const left = Math.ceil((deadline - Date.now()) / 1000);
    if (left <= 0) return endRush();
    showHud(left);
}

function endRush() {
    clearInterval(timer);
    running = false;
    locked = true;
    const best = getBest();
    if (score > best) setBest(score);
    showHud(0);
    promptText.textContent = `Time! You got ${score}`;
    message.textContent = score > best ? "NEW BEST!" : `BEST ${best}`;
    mainButton.textContent = "AGAIN?";
}

// ---- shared ----

// stop any run in progress and start fresh in the current mode
function reset() {
    clearInterval(timer);
    running = false;
    hud.hidden = !rush;
    if (rush) rushReady();
    else newRound();
}

// main button and spacebar
function action() {
    if (!rush) newRound();
    else if (running) deal(); // skip: new colors, no penalty
    else startRush();
}

function setCount(n) {
    count = n;
    reset();
}

boxes.forEach((box) => {
    box.addEventListener("click", () => {
        if (locked) return;
        if (box.style.backgroundColor !== goal) {
            box.style.opacity = 0; // fade out the wrong guess, shadow included
            message.textContent = "TRY AGAIN :/";
        } else if (running) {
            score++;
            deal();
            tick();
        } else {
            win();
        }
    });
});

easy.addEventListener("change", () => setCount(3));
hard.addEventListener("change", () => setCount(6));

rushToggle.addEventListener("click", () => {
    rush = !rush;
    rushToggle.setAttribute("aria-pressed", rush);
    reset();
});

mainButton.addEventListener("click", action);

// spacebar does the same as the main button
document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat) return;
    e.preventDefault(); // stop space from also clicking a focused button or scrolling
    action();
});

newRound();
