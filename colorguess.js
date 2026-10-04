const boxes = document.querySelectorAll(".box");
const promptText = document.getElementById("prompt");
const rgb = document.getElementById("rgb");
const message = document.getElementById("message");
const newColors = document.getElementById("new-colors");
const easy = document.getElementById("easy");
const hard = document.getElementById("hard");

let count = 6; // number of boxes in play: 3 for easy, 6 for hard
let goal; // the winning color
let won = false;

function randomColor() {
    const channel = () => Math.floor(Math.random() * 256);
    return `rgb(${channel()}, ${channel()}, ${channel()})`;
}

function newRound() {
    const colors = Array.from({ length: count }, randomColor);
    goal = colors[Math.floor(Math.random() * count)];
    won = false;

    rgb.textContent = goal;
    promptText.textContent = "Can you guess this color?? NOW CHOOSE!";
    message.textContent = "";
    newColors.textContent = "NEW COLORS";
    document.body.style.backgroundColor = "";

    boxes.forEach((box, i) => {
        box.style.backgroundColor = colors[i] || "";
        box.style.display = colors[i] ? "" : "none";
    });
}

function win() {
    won = true;
    promptText.textContent = "You guessed it right AMAZING DUDE!!";
    message.textContent = "CORRECT! ^-^";
    newColors.textContent = "PLAY AGAIN?";
    document.body.style.backgroundColor = goal;
    boxes.forEach((box) => (box.style.backgroundColor = "white"));
}

function setMode(n, selected) {
    count = n;
    easy.classList.toggle("selected", selected === easy);
    hard.classList.toggle("selected", selected === hard);
    newRound();
}

boxes.forEach((box) => {
    box.addEventListener("click", () => {
        if (won) return;
        if (box.style.backgroundColor === goal) {
            win();
        } else {
            box.style.backgroundColor = ""; // fade the wrong guess into the background
            message.textContent = "TRY AGAIN :/";
        }
    });
});

easy.addEventListener("click", () => setMode(3, easy));
hard.addEventListener("click", () => setMode(6, hard));
newColors.addEventListener("click", newRound);

// spacebar does the same as the NEW COLORS / PLAY AGAIN button
document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat) return;
    e.preventDefault(); // stop space from also clicking a focused button or scrolling
    newRound();
});

newRound();
