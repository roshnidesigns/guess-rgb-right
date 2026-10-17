const boxes = document.querySelectorAll(".box");
const promptText = document.getElementById("prompt");
const rgb = document.getElementById("rgb");
const message = document.getElementById("message");
const newColors = document.getElementById("new-colors");
const easy = document.getElementById("easy");
const hard = document.getElementById("hard");
const rushToggle = document.getElementById("rush");

const RUSH_SECONDS = 30;

let count = 6; // number of boxes in play: 3 for easy, 6 for hard
let goal; // the winning color
let won = false; // true when box clicks should be ignored

// rush mode: guess as many as you can in RUSH_SECONDS
let rush = false; // rush mode selected
let running = false; // a rush run is in progress
let score = 0;
let deadline;
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

// best rush score for this browser tab session, kept separately for easy and hard
function getBest() {
    try {
        return Number(sessionStorage.getItem(`best-${count}-${RUSH_SECONDS}`)) || 0;
    } catch {
        return 0;
    }
}

function setBest(n) {
    try {
        sessionStorage.setItem(`best-${count}-${RUSH_SECONDS}`, n);
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

function newRound() {
    deal();
    won = false;
    promptText.textContent = "Can you guess this color?";
    newColors.textContent = "NEW COLORS";
}

function win() {
    won = true;
    promptText.textContent = "You guessed it right AMAZING DUDE!!";
    message.textContent = "CORRECT! ^-^";
    newColors.textContent = "AGAIN?";
    document.body.style.backgroundColor = goal;
    document.body.classList.toggle("dark", isDark(goal));
    boxes.forEach((box) => (box.style.backgroundColor = "var(--beige)"));
}

// rush, before a run: show the colors but wait for START
function rushReady() {
    deal();
    won = true;
    promptText.textContent = `${RUSH_SECONDS} seconds · best ${getBest()}`;
    newColors.textContent = "START";
}

function startRush() {
    running = true;
    won = false;
    score = 0;
    deadline = Date.now() + RUSH_SECONDS * 1000;
    deal();
    newColors.textContent = "SKIP";
    tick();
    timer = setInterval(tick, 100);
}

function tick() {
    const left = Math.ceil((deadline - Date.now()) / 1000);
    if (left <= 0) return endRush();
    promptText.textContent = `${left}s · score ${score}`;
}

function endRush() {
    clearInterval(timer);
    running = false;
    won = true;
    const best = getBest();
    if (score > best) setBest(score);
    promptText.textContent = `Time! You got ${score}`;
    message.textContent = score > best ? "NEW BEST!" : `BEST ${best}`;
    newColors.textContent = "AGAIN?";
}

// leave any run in progress and start fresh in the current mode
function reset() {
    clearInterval(timer);
    running = false;
    if (rush) rushReady();
    else newRound();
}

// main button and spacebar
function action() {
    if (!rush) newRound();
    else if (running) deal(); // skip: new colors, no penalty
    else startRush();
}

function setCount(n, selected) {
    count = n;
    easy.classList.toggle("selected", selected === easy);
    hard.classList.toggle("selected", selected === hard);
    reset();
}

boxes.forEach((box) => {
    box.addEventListener("click", () => {
        if (won) return;
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

easy.addEventListener("click", () => setCount(3, easy));
hard.addEventListener("click", () => setCount(6, hard));
rushToggle.addEventListener("click", () => {
    rush = !rush;
    rushToggle.classList.toggle("selected", rush);
    reset();
});
newColors.addEventListener("click", action);

// spacebar does the same as the main button
document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat) return;
    e.preventDefault(); // stop space from also clicking a focused button or scrolling
    action();
});

newRound();
