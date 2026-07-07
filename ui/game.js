const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const mapCanvas = document.getElementById("mapCanvas");
const mapContext = mapCanvas.getContext("2d");
const healthDisplay = document.getElementById("health");
const memoryCount = document.getElementById("memoryCount");
const friendshipDisplay = document.getElementById("friendship");
const questProgress = document.getElementById("questProgress");
const questBar = document.getElementById("questBar");
const dialogText = document.getElementById("dialogText");
const inventoryList = document.getElementById("inventoryList");
const toast = document.getElementById("toast");
const titleScreen = document.getElementById("titleScreen");
const pauseMenu = document.getElementById("pauseMenu");
const startButton = document.getElementById("startButton");
const continueButton = document.getElementById("continueButton");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");
const biomeLabel = document.getElementById("biomeLabel");

const tileSize = 64;
const saveKey = "myco-2-commercial-save";
const pressedKeys = new Set();
const companionLines = [
    "...this place feels wrong, but the spores trust you.",
    "...look behind lantern trees. Memories hide in warm light.",
    "...don't touch the violet bloom until the gate is awake.",
    "The Moon Pool remembers every footstep.",
    "If the roots glow, we are close."
];

const rawMap = [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "T....M.....T.....w....B.....T",
    "T.TTT..T...T..wwwwwww..T....T",
    "T....R.T......wwwwwww..T.M..T",
    "T..M...T..C....wwwww...T....T",
    "T......T.....TTTTTTT........T",
    "T..TTT....N.....M.....TTT...T",
    "T....T..TTTTT.......M...T...T",
    "T.M..T....P....T.........C..T",
    "T....T.........T....G.......T",
    "T......C....R.......T....M..T",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTT"
];

const tileColors = { ".": "#163f2a", "T": "#092018", "w": "#123d54", "R": "#3f2418", "C": "#20365d", "G": "#6b4a2d", "B": "#4b214e", "N": "#163f2a", "M": "#163f2a", "P": "#163f2a" };
const itemNames = { R: "Ancient Root", C: "Crystal Spore", B: "Impossible Bloom", M: "Moon Cap" };
const blockingTiles = new Set(["T", "w"]);
const inventory = new Map();
const particles = [];
const fireflies = [];
let memories = [];
let player;
let camera;
let running = false;
let paused = false;
let barkTimer = 0;
let interactPressed = false;
let lineIndex = 0;
let lastTimestamp = 0;
let won = false;

function makeDefaultPlayer() {
    return { x: 12.5 * tileSize, y: 8.5 * tileSize, radius: 20, speed: 235, health: 3, friendship: 1, facing: "down", steps: 0 };
}

function buildCollectibles() {
    memories = [];
    rawMap.forEach((row, y) => {
        [...row].forEach((tile, x) => {
            if (itemNames[tile]) memories.push({ id: `${x}-${y}-${tile}`, x: x * tileSize + 32, y: y * tileSize + 32, tile, collected: false });
        });
    });
}

function seedAtmosphere() {
    const worldWidth = rawMap[0].length * tileSize;
    const worldHeight = rawMap.length * tileSize;
    for (let index = 0; index < 150; index += 1) {
        particles[index] = { x: Math.random() * worldWidth, y: Math.random() * worldHeight, drift: 12 + Math.random() * 36, phase: Math.random() * Math.PI * 2, size: 1 + Math.random() * 3 };
    }
    for (let index = 0; index < 26; index += 1) {
        fireflies[index] = { x: Math.random() * worldWidth, y: Math.random() * worldHeight, phase: Math.random() * Math.PI * 2 };
    }
}

function startGame(loadedState = null) {
    player = makeDefaultPlayer();
    camera = { x: 0, y: 0 };
    inventory.clear();
    buildCollectibles();
    seedAtmosphere();
    won = false;
    paused = false;
    running = true;
    barkTimer = 0;
    lineIndex = 0;

    if (loadedState) hydrateState(loadedState);
    titleScreen.classList.add("hidden");
    pauseMenu.classList.add("hidden");
    toast.textContent = "Explore Lantern Woods. Press E near Myco, memories, or the Elder Gate.";
    dialogText.textContent = "I have seen this tree before...";
    updateCamera();
    updateHud();
}

function hydrateState(state) {
    player = { ...player, ...state.player };
    won = Boolean(state.won);
    (state.collectedIds || []).forEach((id) => {
        const memory = memories.find((item) => item.id === id);
        if (memory) memory.collected = true;
    });
    Object.entries(state.inventory || {}).forEach(([name, amount]) => inventory.set(name, amount));
}

function collectState() {
    return { player, won, inventory: Object.fromEntries(inventory), collectedIds: memories.filter((memory) => memory.collected).map((memory) => memory.id) };
}

function saveGame() {
    localStorage.setItem(saveKey, JSON.stringify(collectState()));
}

function loadGame() {
    try {
        const stored = localStorage.getItem(saveKey);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.warn("Could not load Myco save", error);
        return null;
    }
}

function updateHud() {
    const collected = memories.filter((memory) => memory.collected).length;
    const total = memories.length || 1;
    healthDisplay.textContent = "❤️".repeat(player.health) || "💀";
    memoryCount.textContent = `🧠 ${collected}`;
    friendshipDisplay.textContent = `🤝 ${player.friendship}`;
    questProgress.textContent = `${collected} / ${total} Memories`;
    questBar.style.width = `${Math.round((collected / total) * 100)}%`;
    biomeLabel.textContent = player.x > 1150 ? "Crystal Hollow" : player.y > 520 ? "Moon Pool" : "Lantern Woods";
    inventoryList.innerHTML = "";
    const entries = [...inventory.entries()];
    if (entries.length === 0) entries.push(["Empty satchel", 0]);
    entries.forEach(([name, amount]) => {
        const row = document.createElement("li");
        row.innerHTML = `<span>${name === "Empty satchel" ? "🎒" : "🍄"} ${name}</span><strong>x${amount}</strong>`;
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
    const checks = [[x - player.radius, y - player.radius], [x + player.radius, y - player.radius], [x - player.radius, y + player.radius], [x + player.radius, y + player.radius]];
    return checks.every(([checkX, checkY]) => !blockingTiles.has(tileAtPixel(checkX, checkY)));
}

function updatePlayer(deltaSeconds) {
    let dx = 0;
    let dy = 0;
    if (isPressed("ArrowLeft", "KeyA")) dx -= 1;
    if (isPressed("ArrowRight", "KeyD")) dx += 1;
    if (isPressed("ArrowUp", "KeyW")) dy -= 1;
    if (isPressed("ArrowDown", "KeyS")) dy += 1;
    if (dx === 0 && dy === 0) return;
    const length = Math.hypot(dx, dy);
    const nextX = player.x + (dx / length) * player.speed * deltaSeconds;
    const nextY = player.y + (dy / length) * player.speed * deltaSeconds;
    player.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    player.steps += deltaSeconds * 8;
    if (canMoveTo(nextX, player.y)) player.x = nextX;
    if (canMoveTo(player.x, nextY)) player.y = nextY;
}

function nearestMemory() {
    return memories.find((memory) => !memory.collected && Math.hypot(player.x - memory.x, player.y - memory.y) < 54);
}

function interact() {
    const memory = nearestMemory();
    if (memory) {
        memory.collected = true;
        const itemName = itemNames[memory.tile];
        inventory.set(itemName, (inventory.get(itemName) || 0) + 1);
        player.friendship += memory.tile === "B" ? 2 : 1;
        dialogText.textContent = `You found ${itemName}. Myco's cap glows brighter.`;
        toast.textContent = memories.every((item) => item.collected) ? "All memories found. The Elder Gate is glowing." : `${itemName} added to your satchel.`;
        updateHud();
        saveGame();
        return;
    }

    const gateX = 20 * tileSize + 32;
    const gateY = 9 * tileSize + 32;
    if (Math.hypot(player.x - gateX, player.y - gateY) < 62) {
        if (memories.every((item) => item.collected)) completeRun();
        else toast.textContent = "The Elder Gate needs every forest memory before it opens.";
        return;
    }

    const mycoX = 12 * tileSize + 32;
    const mycoY = 6 * tileSize + 32;
    if (Math.hypot(player.x - mycoX, player.y - mycoY) < 76) {
        lineIndex = (lineIndex + 1) % companionLines.length;
        dialogText.textContent = companionLines[lineIndex];
        player.friendship += 1;
        updateHud();
        saveGame();
        return;
    }
    toast.textContent = "Nothing answers here. Follow the brighter spores.";
}

function completeRun() {
    won = true;
    running = false;
    paused = false;
    toast.textContent = "Checkpoint saved: Moon Pool. The Elder Gate opens.";
    dialogText.textContent = "The forest remembers you. Gemma can guide the next chapter from here.";
    pauseMenu.classList.remove("hidden");
    pauseMenu.querySelector("h2").textContent = "Elder Gate Opened";
    resumeButton.textContent = "Explore More";
    saveGame();
}

function updateCompanion(deltaSeconds) {
    barkTimer += deltaSeconds;
    if (barkTimer >= 24) {
        barkTimer = 0;
        lineIndex = (lineIndex + 1) % companionLines.length;
        dialogText.textContent = companionLines[lineIndex];
    }
}

function updateCamera() {
    const worldWidth = rawMap[0].length * tileSize;
    const worldHeight = rawMap.length * tileSize;
    camera.x += (Math.max(0, Math.min(worldWidth - canvas.width, player.x - canvas.width / 2)) - camera.x) * 0.14;
    camera.y += (Math.max(0, Math.min(worldHeight - canvas.height, player.y - canvas.height / 2)) - camera.y) * 0.14;
}

function updateGame(deltaSeconds) {
    if (isPressed("KeyE") && !interactPressed) interact();
    interactPressed = isPressed("KeyE");
    updatePlayer(deltaSeconds);
    updateCompanion(deltaSeconds);
    updateCamera();
}

function drawWorld(time) {
    context.save();
    context.translate(-camera.x, -camera.y);
    rawMap.forEach((row, y) => {
        [...row].forEach((tile, x) => drawTile(tile, x * tileSize, y * tileSize, time));
    });
    drawParticles(time);
    memories.forEach((memory) => { if (!memory.collected) drawMemory(memory, time); });
    drawPlayer(time);
    drawLighting();
    context.restore();
}

function drawTile(tile, x, y, time) {
    context.fillStyle = tileColors[tile] || tileColors["."];
    context.fillRect(x, y, tileSize, tileSize);
    context.strokeStyle = "rgba(255,255,255,0.032)";
    context.strokeRect(x, y, tileSize, tileSize);
    if (tile === "T") drawTree(x, y, time);
    if (tile === "w") drawWater(x, y, time);
    if (tile === "G") drawGate(x, y);
    if (tile === "N") drawMyco(x, y, time);
    if (tile === "P") drawMoonPool(x, y, time);
}

function drawTree(x, y, time) {
    context.fillStyle = "#06120d";
    context.fillRect(x + 24, y + 24, 16, 36);
    const sway = Math.sin(time / 900 + x) * 2;
    context.fillStyle = "#145332";
    context.beginPath();
    context.arc(x + 32 + sway, y + 24, 28, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(137,255,181,0.16)";
    context.fillRect(x + 16, y + 12, 8, 8);
}

function drawWater(x, y, time) {
    context.fillStyle = "#1d6f83";
    context.fillRect(x, y, tileSize, tileSize);
    context.strokeStyle = "rgba(135,247,255,0.58)";
    for (let wave = 0; wave < 2; wave += 1) {
        context.beginPath();
        context.moveTo(x + 8, y + 22 + wave * 16 + Math.sin(time / 300 + x) * 4);
        context.lineTo(x + 56, y + 24 + wave * 16 + Math.cos(time / 300 + y) * 4);
        context.stroke();
    }
}

function drawGate(x, y) {
    const open = memories.every((memory) => memory.collected);
    context.shadowColor = open ? "#89ffb5" : "transparent";
    context.shadowBlur = open ? 24 : 0;
    context.fillStyle = open ? "#89ffb5" : "#7c5330";
    context.fillRect(x + 13, y + 4, 38, 56);
    context.fillStyle = "#160d08";
    context.fillRect(x + 30, y + 32, 7, 10);
    context.shadowBlur = 0;
}

function drawMyco(x, y, time) {
    const bob = Math.sin(time / 420) * 3;
    context.fillStyle = "#ffe8c4";
    context.fillRect(x + 26, y + 30 + bob, 14, 24);
    context.fillStyle = "#ff8fb3";
    context.beginPath();
    context.ellipse(x + 33, y + 28 + bob, 26, 17, 0, Math.PI, 0);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.92)";
    context.fillRect(x + 21, y + 20 + bob, 6, 6);
    context.fillRect(x + 39, y + 18 + bob, 7, 7);
}

function drawMoonPool(x, y, time) {
    context.fillStyle = "rgba(135,247,255,0.26)";
    context.beginPath();
    context.ellipse(x + 32, y + 36, 26 + Math.sin(time / 300) * 3, 17, 0, 0, Math.PI * 2);
    context.fill();
}

function drawMemory(memory, time) {
    const pulse = Math.sin(time / 220 + memory.x) * 4;
    context.shadowColor = memory.tile === "C" ? "#87f7ff" : "#89ffb5";
    context.shadowBlur = 22;
    context.fillStyle = memory.tile === "B" ? "#f7a2ff" : memory.tile === "C" ? "#87f7ff" : memory.tile === "R" ? "#ffd76a" : "#ff8fb3";
    context.beginPath();
    context.arc(memory.x, memory.y + pulse, 14, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
}

function drawParticles(time) {
    particles.forEach((particle) => {
        const x = particle.x + Math.sin(time / 900 + particle.phase) * particle.drift;
        const y = particle.y + Math.cos(time / 1100 + particle.phase) * 10;
        context.fillStyle = "rgba(137,255,181,0.58)";
        context.fillRect(x, y, particle.size, particle.size);
    });
    fireflies.forEach((bug) => {
        context.fillStyle = `rgba(255,215,106,${0.28 + Math.sin(time / 260 + bug.phase) * 0.22})`;
        context.beginPath();
        context.arc(bug.x + Math.sin(time / 800 + bug.phase) * 18, bug.y, 3, 0, Math.PI * 2);
        context.fill();
    });
}

function drawPlayer(time) {
    const bob = Math.sin(player.steps) * 2;
    context.fillStyle = "rgba(0,0,0,0.24)";
    context.beginPath();
    context.ellipse(player.x, player.y + 20, 18, 7, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#f0d0a0";
    context.beginPath();
    context.arc(player.x, player.y - 3 + bob, player.radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#334cff";
    context.fillRect(player.x - 11, player.y + 2 + bob, 22, 18);
    context.fillStyle = "#111822";
    context.fillRect(player.x - 8, player.y - 8 + bob, 5, 5);
    context.fillRect(player.x + 5, player.y - 8 + bob, 5, 5);
    context.fillStyle = "rgba(255,215,106,0.82)";
    context.fillRect(player.x + (player.facing === "left" ? -22 : 18), player.y + 4 + bob, 6, 10);
    void time;
}

function drawLighting() {
    const gradient = context.createRadialGradient(player.x, player.y, 40, player.x, player.y, 280);
    gradient.addColorStop(0, "rgba(255, 240, 180, 0.16)");
    gradient.addColorStop(1, "rgba(255, 240, 180, 0)");
    context.fillStyle = gradient;
    context.fillRect(player.x - 300, player.y - 300, 600, 600);
}

function drawMap(time) {
    mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    mapContext.fillStyle = "rgba(5,12,20,0.68)";
    mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    const nodes = [
        [68, 158, "Spore Marsh"], [142, 130, "Moon Pool"], [85, 82, "Lantern Woods"], [190, 82, "Crystal Hollow"], [166, 34, "Elder Roots"], [286, 34, "Impossible Bloom"]
    ];
    mapContext.strokeStyle = "rgba(137,255,181,0.55)";
    mapContext.lineWidth = 3;
    mapContext.beginPath();
    nodes.slice(0, -1).forEach(([x, y], index) => {
        const [nextX, nextY] = nodes[index + 1];
        mapContext.moveTo(x, y);
        mapContext.lineTo(nextX, nextY);
    });
    mapContext.stroke();
    nodes.forEach(([x, y, label], index) => {
        const pulse = 5 + Math.sin(time / 350 + index) * 2;
        mapContext.fillStyle = index < 3 ? "#89ffb5" : "#ffd76a";
        mapContext.beginPath();
        mapContext.arc(x, y, pulse, 0, Math.PI * 2);
        mapContext.fill();
        mapContext.fillStyle = "#f5fff9";
        mapContext.font = "11px system-ui";
        mapContext.fillText(label, x + 10, y + 4);
    });
}

function drawOverlay() {
    if (running && !paused) return;
    context.fillStyle = "rgba(0, 0, 0, 0.30)";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(timestamp) {
    const deltaSeconds = Math.min(0.05, (timestamp - lastTimestamp) / 1000 || 0);
    lastTimestamp = timestamp;
    if (running && !paused) updateGame(deltaSeconds);
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawWorld(timestamp);
    drawOverlay();
    drawMap(timestamp);
    window.requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(960, Math.floor(rect.width));
    canvas.height = Math.max(540, Math.floor(rect.height));
    if (camera) updateCamera();
}

function handleChoice(choice) {
    if (!player) return;
    player.friendship += choice === "Ignore" ? 0 : 1;
    dialogText.textContent = `► ${choice}: Myco will remember that.`;
    updateHud();
    saveGame();
}

function togglePause(forceState = null) {
    if (!player) return;
    if (won) {
        paused = false;
        running = true;
        pauseMenu.classList.add("hidden");
        toast.textContent = "The gate remains open. Keep exploring the moonlit forest.";
        return;
    }
    paused = forceState === null ? !paused : forceState;
    running = !paused;
    pauseMenu.classList.toggle("hidden", !paused);
    toast.textContent = paused ? "Paused at the Moon Pool checkpoint." : "Adventure resumed.";
    if (paused) saveGame();
}

function showMapToast() {
    toast.textContent = "Map route: Spore Marsh → Moon Pool → Lantern Woods → Crystal Hollow → Elder Roots.";
}

window.addEventListener("keydown", (event) => {
    pressedKeys.add(event.code);
    if (event.code === "KeyR") startGame();
    if (event.code === "KeyP") togglePause();
    if (event.code === "KeyM") showMapToast();
});
window.addEventListener("keyup", (event) => pressedKeys.delete(event.code));
window.addEventListener("resize", resizeCanvas);
startButton.addEventListener("click", () => startGame());
continueButton.addEventListener("click", () => startGame(loadGame()));
resumeButton.addEventListener("click", () => togglePause(false));
restartButton.addEventListener("click", () => startGame());
document.querySelectorAll("#dialogChoices button").forEach((button) => button.addEventListener("click", () => handleChoice(button.dataset.choice)));
document.querySelectorAll("[data-touch]").forEach((button) => {
    const code = button.dataset.touch;
    button.addEventListener("pointerdown", () => pressedKeys.add(code));
    button.addEventListener("pointerup", () => pressedKeys.delete(code));
    button.addEventListener("pointerleave", () => pressedKeys.delete(code));
});

resizeCanvas();
player = makeDefaultPlayer();
camera = { x: 0, y: 0 };
buildCollectibles();
seedAtmosphere();
updateHud();
continueButton.disabled = !loadGame();
window.requestAnimationFrame(gameLoop);
