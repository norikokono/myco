const world = document.getElementById("world");
const inventoryList = document.getElementById("inventoryList");
const mapNodes = document.getElementById("mapNodes");
const loading = document.getElementById("loading");
const dialogText = document.getElementById("dialogText");
const score = document.getElementById("score");

const forestItems = ["🍄", "🌿", "✨"];
const dialogLines = [
    "Welcome to the forest...",
    "The spores are pointing toward something impossible.",
    "Collect mooncaps to remember the path."
];

function createElement(className, styles = {}) {
    const element = document.createElement("div");
    element.className = className;

    Object.entries(styles).forEach(([property, value]) => {
        element.style.setProperty(property, value);
    });

    return element;
}

function populateForest() {
    const treePositions = [6, 18, 31, 46, 61, 76, 90];
    const mushroomPositions = [14, 39, 57, 83];

    treePositions.forEach((position, index) => {
        world.appendChild(createElement("tree", {
            left: `${position}%`,
            height: `${42 + (index % 3) * 8}%`,
            transform: `scale(${0.82 + (index % 4) * 0.12})`
        }));
    });

    mushroomPositions.forEach((position, index) => {
        world.appendChild(createElement("mushroom", {
            left: `${position}%`,
            transform: `scale(${0.82 + index * 0.08})`
        }));
    });

    for (let index = 0; index < 34; index += 1) {
        world.appendChild(createElement("spore", {
            left: `${Math.random() * 100}%`,
            top: `${15 + Math.random() * 70}%`,
            "--duration": `${7 + Math.random() * 8}s`,
            "animation-delay": `${Math.random() * -10}s`
        }));
    }
}

function populateInventory() {
    forestItems.forEach((item) => {
        const slot = document.createElement("li");
        slot.textContent = item;
        inventoryList.appendChild(slot);
    });
}

function populateMap() {
    const nodes = [
        { left: "8%", top: "58%", active: true },
        { left: "34%", top: "34%", active: false },
        { left: "62%", top: "52%", active: false },
        { left: "84%", top: "20%", active: false }
    ];

    nodes.forEach((node) => {
        const mapNode = createElement(`map-node${node.active ? " active" : ""}`, {
            left: node.left,
            top: node.top
        });
        mapNodes.appendChild(mapNode);
    });
}

function rotateDialog() {
    let lineIndex = 0;

    window.setInterval(() => {
        lineIndex = (lineIndex + 1) % dialogLines.length;
        dialogText.textContent = dialogLines[lineIndex];
    }, 4200);
}

function initializeGameShell() {
    populateForest();
    populateInventory();
    populateMap();
    rotateDialog();
    score.textContent = "⭐ 0";

    window.setTimeout(() => {
        loading.classList.add("hidden");
    }, 700);
}

document.addEventListener("DOMContentLoaded", initializeGameShell);
