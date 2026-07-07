const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const healthDisplay = document.getElementById("health");
const memoryCount = document.getElementById("memoryCount");
const friendshipDisplay = document.getElementById("friendship");
const questProgress = document.getElementById("questProgress");
const dialogText = document.getElementById("dialogText");
const inventoryList = document.getElementById("inventoryList");
const toast = document.getElementById("toast");
const startButton = document.getElementById("startButton");

const tileSize = 64;
const pressedKeys = new Set();
const companionLines = [
    "...this place feels wrong.",
    "...look behind that tree.",
    "...don't touch that mushroom.",
    "The Moon Pool remembers every footstep.",
    "If the roots glow, we are close."
];

const rawMap = [
    "TTTTTTTTTTTTTTTTTTTTTTTT",
    "T....M....T....w....B...T",
    "T.TTT..T..T..wwwww..T...T",
    "T....R.T.....wwwww..T.M.T",
    "T..M...T..C...www...T...T",
    "T......T.....TTTTT......T",
    "T..TTT....N.....M....TT.T",
    "T....T..TTTTT.......M...T",
    "T.M..T....P....T........T",
    "T....T.........T....G...T",
    "TTTTTTTTTTTTTTTTTTTTTTTT"
];

const tileColors = {
    ".": "#163f2a",
    "T": "#092018",
    "w": "#123d54",
    "R": "#3f2418",
    "C": "#20365d",
    "G": "#6b4a2d",
    "B": "#4b214e",
    "N": "#163f2a",
    "M": "#163f2a",
    "P": "#163f2a"
};

const blockingTiles = new Set(["T", "w"]);
const inventory = new Map();
const particles = [];
let memories = [];
let player;
let camera;
let running = false;
let barkTimer = 0;
let lineIndex = 0;
let lastTimestamp = 0;
let won = false;

function resetGame() {
    player = { x: 12.5 * tileSize, y: 8.5 * tileSize, radius: 20, speed: 220, health: 3, friendship: 1 };
    camera = { x: 0, y: 0 };
    memories = [];
    inventory.clear();
    won = false;
    running = true;
    barkTimer = 0;
    lineIndex = 0;

    rawMap.forEach((row, y) => {
        [...row].forEach((tile, x) => {
            if (tile === "M" || tile === "R" || tile === "C" || tile === "B") {
                memories.push({ x: x * tileSize + 32, y: y * tileSize + 32, tile, collected: false });
            }
        });
    });

    for (let index = 0; index < 90; index += 1) {
        particles[index] = {
            x: Math.random() * rawMap[0].length * tileSize,
            y: Math.random() * rawMap.length * tileSize,
            drift: 12 + Math.random() * 28,
            phase: Math.random() * Math.PI * 2
        };
    }

    startButton.classList.add("hidden");
    toast.textContent = "Explore Lantern Woods. Walk near Myco or glowing memories.";
    dialogText.textContent = "I have seen this tree before...";
    updateHud();
}

function updateHud() {
    const collected = memories.filter((memory) => memory.collected).length;
    const boxes = "■".repeat(collected).padEnd(10, "□");
    healthDisplay.textContent = "❤️".repeat(player.health) || "💀";
    memoryCount.textContent = `🧠 ${collected}`;
    friendshipDisplay.textContent = `🤝 ${player.friendship}`;
    questProgress.textContent = `${boxes} ${collected} / 10 Memories`;
    inventoryList.innerHTML = "";

    const entries = [...inventory.entries()];
    if (entries.length === 0) entries.push(["Moon Cap", 0]);
    entries.forEach(([name, amount]) => {
        const row = document.createElement("li");
        row.textContent = `🍄 ${name} x${amount}`;
        inventoryList.appendChild(row);
    });
}

function isPressed(...codes) {
    return codes.some((code) => pressedKeys.has(code));
}

function tileAtPixel(x, y) {
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    return rawMap[tileY]?.[tileX] ?? "T";
}

function canMoveTo(x, y) {
    const checks = [
        [x - player.radius, y - player.radius],
        [x + player.radius, y - player.radius],
        [x - player.radius, y + player.radius],
        [x + player.radius, y + player.radius]
    ];
    return checks.every(([checkX, checkY]) => !blockingTiles.has(tileAtPixel(checkX, checkY)));
}

function updatePlayer(deltaSeconds) {
    let dx = 0;
    let dy = 0;
    if (isPressed("ArrowLeft", "KeyA")) dx -= 1;
    if (isPressed("ArrowRight", "KeyD")) dx += 1;
    if (isPressed("ArrowUp", "KeyW")) dy -= 1;
    if (isPressed("ArrowDown", "KeyS")) dy += 1;

    if (dx !== 0 || dy !== 0) {
        const length = Math.hypot(dx, dy);
        const nextX = player.x + (dx / length) * player.speed * deltaSeconds;
        const nextY = player.y + (dy / length) * player.speed * deltaSeconds;
        if (canMoveTo(nextX, player.y)) player.x = nextX;
        if (canMoveTo(player.x, nextY)) player.y = nextY;
    }
}

function updateMemories() {
    memories.forEach((memory) => {
        if (memory.collected) return;
        const distance = Math.hypot(player.x - memory.x, player.y - memory.y);
        if (distance < 42) {
            memory.collected = true;
            const itemName = memory.tile === "R" ? "Ancient Root" : memory.tile === "C" ? "Crystal Spore" : memory.tile === "B" ? "Impossible Bloom" : "Moon Cap";
            inventory.set(itemName, (inventory.get(itemName) || 0) + 1);
            dialogText.textContent = `You found ${itemName}. Myco seems to remember more.`;
            if (memories.every((item) => item.collected)) toast.textContent = "All memories found. The Elder Gate is glowing.";
            updateHud();
        }
    });
}

function updateCompanion(deltaSeconds) {
    barkTimer += deltaSeconds;
    if (barkTimer >= 30) {
        barkTimer = 0;
        lineIndex = (lineIndex + 1) % companionLines.length;
        dialogText.textContent = companionLines[lineIndex];
    }
}

function updateCamera() {
    const worldWidth = rawMap[0].length * tileSize;
    const worldHeight = rawMap.length * tileSize;
    camera.x = Math.max(0, Math.min(worldWidth - canvas.width, player.x - canvas.width / 2));
    camera.y = Math.max(0, Math.min(worldHeight - canvas.height, player.y - canvas.height / 2));
}

function updateGate() {
    const allFound = memories.every((memory) => memory.collected);
    const gateX = 20 * tileSize + 32;
    const gateY = 9 * tileSize + 32;
    if (allFound && Math.hypot(player.x - gateX, player.y - gateY) < 48) {
        won = true;
        running = false;
        toast.textContent = "Checkpoint saved: Moon Pool. Myco 2.0 prototype complete.";
        dialogText.textContent = "The Elder Gate opens. Gemma can guide the next chapter from here.";
        startButton.textContent = "Play Again";
        startButton.classList.remove("hidden");
    }
}

function drawWorld(time) {
    context.save();
    context.translate(-camera.x, -camera.y);

    rawMap.forEach((row, y) => {
        [...row].forEach((tile, x) => {
            const px = x * tileSize;
            const py = y * tileSize;
            context.fillStyle = tileColors[tile] || tileColors["."];
            context.fillRect(px, py, tileSize, tileSize);
            context.strokeStyle = "rgba(255,255,255,0.035)";
            context.strokeRect(px, py, tileSize, tileSize);

            if (tile === "T") drawTree(px, py);
            if (tile === "w") drawWater(px, py, time);
            if (tile === "G") drawGate(px, py);
            if (tile === "N") drawMyco(px, py);
        });
    });

    memories.forEach((memory) => {
        if (!memory.collected) drawMemory(memory, time);
    });

    drawParticles(time);
    drawPlayer();
    context.restore();
}

function drawTree(x, y) {
    context.fillStyle = "#06120d";
    context.fillRect(x + 24, y + 24, 16, 36);
    context.fillStyle = "#145332";
    context.beginPath();
    context.arc(x + 32, y + 24, 28, 0, Math.PI * 2);
    context.fill();
}

function drawWater(x, y, time) {
    context.fillStyle = "#1d6f83";
    context.fillRect(x, y, tileSize, tileSize);
    context.strokeStyle = "rgba(135,247,255,0.5)";
    context.beginPath();
    context.moveTo(x + 8, y + 28 + Math.sin(time / 300 + x) * 4);
    context.lineTo(x + 56, y + 30 + Math.cos(time / 300 + y) * 4);
    context.stroke();
}

function drawGate(x, y) {
    const open = memories.every((memory) => memory.collected);
    context.fillStyle = open ? "#89ffb5" : "#7c5330";
    context.fillRect(x + 14, y + 4, 36, 56);
    context.fillStyle = "#160d08";
    context.fillRect(x + 31, y + 32, 6, 10);
}

function drawMyco(x, y) {
    context.fillStyle = "#ffe8c4";
    context.fillRect(x + 26, y + 30, 14, 24);
    context.fillStyle = "#ff8fb3";
    context.beginPath();
    context.ellipse(x + 33, y + 28, 26, 17, 0, Math.PI, 0);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.92)";
    context.fillRect(x + 21, y + 20, 6, 6);
    context.fillRect(x + 39, y + 18, 7, 7);
}

function drawMemory(memory, time) {
    const pulse = Math.sin(time / 220 + memory.x) * 4;
    context.shadowColor = "#89ffb5";
    context.shadowBlur = 18;
    context.fillStyle = memory.tile === "B" ? "#f7a2ff" : memory.tile === "C" ? "#87f7ff" : "#ff8fb3";
    context.beginPath();
    context.arc(memory.x, memory.y + pulse, 14, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
}

function drawParticles(time) {
    particles.forEach((particle) => {
        const x = particle.x + Math.sin(time / 900 + particle.phase) * particle.drift;
        const y = particle.y + Math.cos(time / 1100 + particle.phase) * 10;
        context.fillStyle = "rgba(137,255,181,0.62)";
        context.fillRect(x, y, 3, 3);
    });
}

function drawPlayer() {
    context.fillStyle = "#f0d0a0";
    context.beginPath();
    context.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#334cff";
    context.fillRect(player.x - 10, player.y - 4, 20, 18);
    context.fillStyle = "#111822";
    context.fillRect(player.x - 7, player.y - 8, 5, 5);
    context.fillRect(player.x + 5, player.y - 8, 5, 5);
}

function drawOverlay() {
    if (running) return;
    context.fillStyle = "rgba(0, 0, 0, 0.32)";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(timestamp) {
    const deltaSeconds = Math.min(0.05, (timestamp - lastTimestamp) / 1000 || 0);
    lastTimestamp = timestamp;

    if (running) {
        updatePlayer(deltaSeconds);
        updateMemories();
        updateCompanion(deltaSeconds);
        updateCamera();
        updateGate();
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawWorld(timestamp);
    drawOverlay();
    window.requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(960, Math.floor(rect.width));
    canvas.height = Math.max(540, Math.floor(rect.height));
    if (camera) updateCamera();
}

function handleChoice(choice) {
    player.friendship += choice === "Ignore" ? 0 : 1;
    dialogText.textContent = `► ${choice}: Myco will remember that.`;
    updateHud();
}

window.addEventListener("keydown", (event) => {
    pressedKeys.add(event.code);
    if (event.code === "Space" && !running && !won) resetGame();
    if (event.code === "KeyR") resetGame();
});

window.addEventListener("keyup", (event) => pressedKeys.delete(event.code));
window.addEventListener("resize", resizeCanvas);
startButton.addEventListener("click", resetGame);
document.querySelectorAll("#dialogChoices button").forEach((button) => {
    button.addEventListener("click", () => handleChoice(button.dataset.choice));
});

resizeCanvas();
resetGame();
running = false;
startButton.classList.remove("hidden");
window.requestAnimationFrame(gameLoop);
