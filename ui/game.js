const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const healthDisplay = document.getElementById("health");
const scoreDisplay = document.getElementById("score");
const keysDisplay = document.getElementById("keys");
const dialogText = document.getElementById("dialogText");
const inventoryList = document.getElementById("inventoryList");
const toast = document.getElementById("toast");
const startButton = document.getElementById("startButton");

const keysPressed = new Set();
const gravity = 0.75;
const world = { width: 3600, height: 720, ground: 632 };

const platforms = [
    { x: 0, y: 656, width: 3600, height: 80 },
    { x: 360, y: 530, width: 280, height: 28 },
    { x: 820, y: 455, width: 260, height: 28 },
    { x: 1260, y: 540, width: 320, height: 28 },
    { x: 1760, y: 445, width: 260, height: 28 },
    { x: 2200, y: 520, width: 300, height: 28 },
    { x: 2730, y: 430, width: 280, height: 28 }
];

const mooncapSpawns = [
    { x: 430, y: 478 },
    { x: 930, y: 403 },
    { x: 1390, y: 488 },
    { x: 1840, y: 393 },
    { x: 2350, y: 468 },
    { x: 2850, y: 378 },
    { x: 3180, y: 600 },
    { x: 650, y: 600 }
];

const slimes = [
    { x: 1120, y: 604, width: 54, height: 38, min: 1040, max: 1420, speed: 1.4 },
    { x: 1980, y: 604, width: 54, height: 38, min: 1900, max: 2300, speed: 1.7 },
    { x: 3020, y: 604, width: 54, height: 38, min: 2920, max: 3340, speed: 1.9 }
];

const playerStart = { x: 90, y: 560 };
let player;
let mooncaps;
let cameraX = 0;
let lastTime = 0;
let running = false;
let won = false;

function resetGame() {
    player = {
        x: playerStart.x,
        y: playerStart.y,
        width: 42,
        height: 58,
        velocityX: 0,
        velocityY: 0,
        health: 3,
        score: 0,
        keys: 0,
        grounded: false,
        invulnerable: 0
    };

    mooncaps = mooncapSpawns.map((item) => ({ ...item, collected: false }));
    slimes.forEach((slime, index) => {
        slime.x = [1120, 1980, 3020][index];
        slime.speed = Math.abs(slime.speed);
    });

    cameraX = 0;
    won = false;
    running = true;
    startButton.classList.add("hidden");
    toast.textContent = "Collect mooncaps. Jump on thorn slimes or avoid them.";
    dialogText.textContent = "The forest finally feels playable. Move, jump, collect, survive.";
    updateHud();
}

function updateHud() {
    healthDisplay.textContent = "❤️".repeat(player.health) || "💀";
    scoreDisplay.textContent = `⭐ ${player.score}/8`;
    keysDisplay.textContent = `🗝️ ${player.keys}`;
    inventoryList.innerHTML = "";

    for (let index = 0; index < player.score; index += 1) {
        const item = document.createElement("li");
        item.textContent = "🍄";
        inventoryList.appendChild(item);
    }
}

function isPressed(...codes) {
    return codes.some((code) => keysPressed.has(code));
}

function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function updatePlayer() {
    const moveLeft = isPressed("ArrowLeft", "KeyA");
    const moveRight = isPressed("ArrowRight", "KeyD");
    const jump = isPressed("ArrowUp", "KeyW", "Space");

    player.velocityX = 0;
    if (moveLeft) player.velocityX = -5.4;
    if (moveRight) player.velocityX = 5.4;
    if (jump && player.grounded) {
        player.velocityY = -15.8;
        player.grounded = false;
    }

    player.x += player.velocityX;
    player.x = Math.max(0, Math.min(world.width - player.width, player.x));
    player.velocityY += gravity;
    player.y += player.velocityY;
    player.grounded = false;

    platforms.forEach((platform) => {
        const fallingOntoPlatform = player.velocityY >= 0 && player.y + player.height <= platform.y + player.velocityY + 8;
        if (rectsOverlap(player, platform) && fallingOntoPlatform) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.grounded = true;
        }
    });

    if (player.y > world.height + 120) damagePlayer(3);
    if (player.invulnerable > 0) player.invulnerable -= 1;
}

function updateCollectibles() {
    mooncaps.forEach((mooncap) => {
        if (!mooncap.collected && rectsOverlap(player, { x: mooncap.x, y: mooncap.y, width: 34, height: 42 })) {
            mooncap.collected = true;
            player.score += 1;
            if (player.score === mooncaps.length) {
                player.keys = 1;
                dialogText.textContent = "That's all eight mooncaps. The root gate is awake!";
            }
            updateHud();
        }
    });
}

function updateEnemies() {
    slimes.forEach((slime) => {
        slime.x += slime.speed;
        if (slime.x < slime.min || slime.x > slime.max) slime.speed *= -1;

        if (rectsOverlap(player, slime)) {
            const stomp = player.velocityY > 0 && player.y + player.height - slime.y < 22;
            if (stomp) {
                player.velocityY = -10;
                slime.x = slime.min;
                dialogText.textContent = "Nice bounce. Thorn slimes hate that.";
            } else {
                damagePlayer(1);
            }
        }
    });
}

function damagePlayer(amount) {
    if (player.invulnerable > 0 || won) return;
    player.health -= amount;
    player.invulnerable = 90;
    dialogText.textContent = "Ouch. The forest bites back.";

    if (player.health <= 0) {
        running = false;
        toast.textContent = "Game over. Press R or Start to try again.";
        startButton.textContent = "Restart Game";
        startButton.classList.remove("hidden");
    }
    updateHud();
}

function updateWinCondition() {
    const gate = { x: 3440, y: 522, width: 72, height: 134 };
    if (!won && player.keys > 0 && rectsOverlap(player, gate)) {
        won = true;
        running = false;
        toast.textContent = "You opened the root gate. Myco escapes!";
        dialogText.textContent = "We made it. That feels much more like a game app.";
        startButton.textContent = "Play Again";
        startButton.classList.remove("hidden");
    }
}

function updateCamera() {
    cameraX = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width * 0.42));
}

function drawBackground() {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#071027");
    gradient.addColorStop(0.58, "#0a241e");
    gradient.addColorStop(1, "#051008");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < 70; index += 1) {
        const x = (index * 173 - cameraX * 0.18) % canvas.width;
        const y = 28 + (index * 47) % 250;
        context.fillStyle = index % 5 === 0 ? "#89ffb5" : "rgba(255,255,255,0.8)";
        context.fillRect((x + canvas.width) % canvas.width, y, 2, 2);
    }

    for (let index = 0; index < 18; index += 1) {
        const x = index * 230 - (cameraX * 0.35) % 230;
        drawTree(x, 230 + (index % 4) * 28, 170 + (index % 3) * 36, "#09251f");
    }
}

function drawTree(x, y, height, color) {
    context.fillStyle = "#06100d";
    context.fillRect(x + 42, y + 90, 36, height);
    context.fillStyle = color;
    context.beginPath();
    context.ellipse(x + 60, y + 72, 88, 72, 0, 0, Math.PI * 2);
    context.fill();
}

function drawWorld() {
    context.save();
    context.translate(-cameraX, 0);

    platforms.forEach((platform) => {
        context.fillStyle = platform.y > 640 ? "#18351d" : "#25482e";
        context.fillRect(platform.x, platform.y, platform.width, platform.height);
        context.fillStyle = "#5ee08a";
        context.fillRect(platform.x, platform.y, platform.width, 6);
    });

    mooncaps.forEach((mooncap) => {
        if (!mooncap.collected) drawMooncap(mooncap.x, mooncap.y);
    });

    slimes.forEach((slime) => drawSlime(slime));
    drawGate();
    drawPlayer();
    context.restore();
}

function drawMooncap(x, y) {
    context.shadowColor = "#89ffb5";
    context.shadowBlur = 18;
    context.fillStyle = "#ff8fb3";
    context.beginPath();
    context.ellipse(x + 17, y + 14, 23, 15, 0, Math.PI, 0);
    context.fill();
    context.fillStyle = "#ffe8c4";
    context.fillRect(x + 10, y + 16, 15, 26);
    context.shadowBlur = 0;
}

function drawSlime(slime) {
    context.fillStyle = "#ff6378";
    context.beginPath();
    context.roundRect(slime.x, slime.y, slime.width, slime.height, 16);
    context.fill();
    context.fillStyle = "#310811";
    context.fillRect(slime.x + 14, slime.y + 13, 6, 6);
    context.fillRect(slime.x + 34, slime.y + 13, 6, 6);
}

function drawGate() {
    context.fillStyle = player.keys > 0 ? "#89ffb5" : "#6b4a2d";
    context.fillRect(3440, 522, 72, 134);
    context.fillStyle = "#140d08";
    context.fillRect(3468, 582, 10, 18);
}

function drawPlayer() {
    const blink = player.invulnerable > 0 && Math.floor(player.invulnerable / 6) % 2 === 0;
    if (blink) return;

    context.fillStyle = "#ffe8c4";
    context.fillRect(player.x + 13, player.y + 26, 18, 32);
    context.fillStyle = "#ff8fb3";
    context.beginPath();
    context.ellipse(player.x + 22, player.y + 22, 29, 21, 0, Math.PI, 0);
    context.fill();
    context.fillStyle = "#ffffff";
    context.fillRect(player.x + 8, player.y + 12, 7, 7);
    context.fillRect(player.x + 26, player.y + 8, 8, 8);
}

function drawOverlay() {
    if (running) return;
    context.fillStyle = "rgba(0, 0, 0, 0.34)";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(timestamp) {
    const elapsed = timestamp - lastTime;
    lastTime = timestamp;

    if (running && elapsed < 80) {
        updatePlayer();
        updateCollectibles();
        updateEnemies();
        updateWinCondition();
        updateCamera();
    }

    drawBackground();
    drawWorld();
    drawOverlay();
    window.requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(960, Math.floor(rect.width));
    canvas.height = Math.max(540, Math.floor(rect.height));
}

window.addEventListener("keydown", (event) => {
    keysPressed.add(event.code);
    if (event.code === "Space" && !running && !won) resetGame();
    if (event.code === "KeyR") resetGame();
});

window.addEventListener("keyup", (event) => {
    keysPressed.delete(event.code);
});

window.addEventListener("resize", resizeCanvas);
startButton.addEventListener("click", resetGame);

resizeCanvas();
resetGame();
running = false;
startButton.classList.remove("hidden");
window.requestAnimationFrame(gameLoop);
