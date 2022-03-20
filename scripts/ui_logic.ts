import { changePreset, regionColors, roots } from './visuals/fractal_presets.js';
import { generateColor } from './visuals/colors.js';
import { PlotScale, addRoot, getClosestRoot, getClosestRootFractalwise } from './math/geometry.js';
import { DrawingModes, DrawingResult, runDrawingWorkers } from './drawing/drawing_manager.js';
import { drawNewtonFractal, InitWebgl2Drawing, gl } from './webgl/webgl2_drawing.js';

const rootPointSize = 4.0;
const CLICK_POINT_DISTANCE = 0.125;

let plotScale = PlotScale.calculatePlotScale(window.innerWidth, window.innerHeight);
let holdingPointIndex = -1;

const TOTAL_FPS_RESET_THRESHOLD = 1_000_000;
let totalFps = 0;
let fpsMeasures = 0;

function resetFps() {
    totalFps = 0;
    fpsMeasures = 0;
}

function calculateFps(elapsedMs: number) {
    fpsMeasures += 1;
    let fps = 1000 / elapsedMs;
    totalFps += fps;
    if (totalFps > TOTAL_FPS_RESET_THRESHOLD) {
        totalFps = fps;
        fpsMeasures = 1;
    }

    let precisionPower = 10;
    if (fps < 1) {
        precisionPower = 100;
    }
    fps = Math.round(fps * precisionPower) / precisionPower;

    elapsedMs = Math.round(elapsedMs * 100) / 100;
}

function updateInfoPanel(drawingMode: DrawingModes) {
    loggerDiv.innerHTML = `Roots count: ${roots.length}</br>
Drawing technic: ${drawingMode}</br>
<b>Average FPS: ${Math.round(totalFps * 10 / fpsMeasures) / 10}</b>`;
}

let waitingForDrawing = false;

async function draw(drawingMode?: DrawingModes, threadsCount?: number) {
    drawNewtonFractal(plotScale, roots, regionColors);
    if (drawingMode == undefined) {
        drawingMode = <DrawingModes><any>drawingModeSelect.value;
    }
    if (threadsCount == undefined) {
        threadsCount = parseInt(threadsCountRange.value);
    }

    let iterationsCount = parseInt(iterationsCountRange.value);

    let result = runDrawingWorkers(drawingMode, plotScale, roots, iterationsCount, regionColors, threadsCount);
    if (result == false) {
        waitingForDrawing = true;
        return;
    }
    waitingForDrawing = false;
    let drawingResult = <DrawingResult>await result;
    let data = new Uint8ClampedArray(drawingResult.data);
    let { elapsedMs, plotScale: { x_display_range: width, y_display_range: height } } = drawingResult;

    calculateFps(elapsedMs);

    updateInfoPanel(drawingMode);

    let imageData = new ImageData(data, width, height);
    cpuCanvasContext.putImageData(imageData, 0, 0);

    plotRoots(plotScale, roots);

    if (waitingForDrawing) {
        draw();
    }
}

function plotPoint(x: number, y: number, size: number, plotScale: PlotScale) {
    let [canvasX, canvasY] = transformPointToCanvasScale(x, y, plotScale);
    cpuCanvasContext.moveTo(canvasX, canvasY);
    cpuCanvasContext.beginPath();
    cpuCanvasContext.arc(canvasX, canvasY, size, 0, Math.PI * 2);
    cpuCanvasContext.fillStyle = "wheat";
    cpuCanvasContext.fill();
    cpuCanvasContext.stroke();
    cpuCanvasContext.closePath();
}

function plotRoots(plotScale: PlotScale, roots: number[][]) {
    for (let [x, y] of roots) {
        plotPoint(x, y, rootPointSize, plotScale);
    }
}

function resizeCanvas(width: number, height: number) {
    gpuCanvas.width = cpuCanvas.width = width;
    gpuCanvas.height = cpuCanvas.height = height;
}

async function CanvasClick(me: MouseEvent) {
    if (holdingPointIndex != -1) return;
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    let iterationsCount = parseInt(iterationsCountRange.value);

    if (me.shiftKey) {
        resetFps();
        addRoot(x, y);
    } else if (me.ctrlKey) {
        let { id, dst } = getClosestRoot(x, y);
        resetFps();
        roots.splice(id, 1);
    } else if (me.altKey) {
        let { id, dst } = getClosestRootFractalwise(x, y, iterationsCount);
        regionColors[id] = generateColor();
    }

    draw();
}

function CanvasMouseDown(me: MouseEvent) {
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);

    let { id, dst } = getClosestRoot(x, y);
    if (dst < CLICK_POINT_DISTANCE) {
        holdingPointIndex = id;
    } else {
        holdingPointIndex = -1;
    }
}

function CanvasMouseMove(me: MouseEvent) {
    if (holdingPointIndex == -1) {
        return;
    }
    if (me.buttons != 1) {
        holdingPointIndex = -1;
        return;
    }

    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    roots[holdingPointIndex] = [x, y];

    draw();
}

async function WindowResize() {
    let { innerWidth, innerHeight } = window;
    plotScale = PlotScale.calculatePlotScale(innerWidth, innerHeight);
    resizeCanvas(
        plotScale.x_display_range,
        plotScale.y_display_range
    );
    gl.resize();
    resetFps();
    draw();
}

let cpuCanvas = <HTMLCanvasElement>document.getElementById("cpuCanvas");
let cpuCanvasContext = cpuCanvas.getContext("2d");
let gpuCanvas = <HTMLCanvasElement>document.getElementById("gpuCanvas");
let drawingModeSelect = <HTMLSelectElement>document.getElementById("drawingModeSelect");
let iterationsCountRange = <HTMLInputElement>document.getElementById("iterationsCount");
let iterationsCountDisplay = <HTMLOutputElement>document.getElementById("iterationsCountDisplay");
let threadsCountRange = <HTMLInputElement>document.getElementById("threadsCount");
let threadsCountDisplay = <HTMLOutputElement>document.getElementById("threadsCountDisplay");
let loggerDiv = document.getElementById("logger");
let changePresetButton = <HTMLButtonElement>document.getElementById("changePresetButton");

for (const value of Object.values(DrawingModes)) {
    let option = <HTMLOptionElement>document.createElement("option");
    option.value = (<DrawingModes>value).toString();
    option.innerText = value.toString();
    drawingModeSelect.options.add(option);
}

drawingModeSelect.addEventListener('change', () => {
    resetFps();
    draw();
});

iterationsCountDisplay.value = iterationsCountRange.value;

iterationsCountRange.addEventListener("change", () => {
    iterationsCountDisplay.value = iterationsCountRange.value;
    resetFps();
    draw();
});

threadsCountRange.max = navigator.hardwareConcurrency.toString();
threadsCountDisplay.value = threadsCountRange.value;

threadsCountRange.addEventListener("change", () => {
    threadsCountDisplay.value = threadsCountRange.value;
    resetFps();
    draw();
});

const changePresetButtonCallback = () => {
    changePreset();
    resetFps();
    draw();
};
changePresetButton.addEventListener("click", changePresetButtonCallback);
window.addEventListener("keydown", e => {
    let c = e.key.toLocaleLowerCase();
    if (c == 'c' || c == 'с') {
        changePresetButtonCallback();
    }
});

async function run() {
    InitWebgl2Drawing(gpuCanvas);

    cpuCanvas.addEventListener("mousedown", CanvasMouseDown);
    cpuCanvas.addEventListener("click", CanvasClick);
    cpuCanvas.addEventListener("mousemove", CanvasMouseMove);

    window.addEventListener("resize", WindowResize);

    let iterationsCount = parseInt(iterationsCountRange.value);
    let firstDraw = runDrawingWorkers(<DrawingModes><any>drawingModeSelect.value, plotScale, roots, iterationsCount, regionColors);
    (<Promise<void>>firstDraw).then(async () => {
        WindowResize();
        await InitWebgl2Drawing(gpuCanvas);

        drawNewtonFractal(plotScale, roots, regionColors);
    });
}

run();