import { changePreset, regionColors, roots } from './visuals/fractal_presets.js';
import { generateColor } from './visuals/colors.js';
import { PlotScale, addRoot, getClosestRoot, getClosestRootFractalwise } from './math/geometry.js';
import { DrawingModes, runDrawingWorkers } from './drawing/drawing_manager.js';
import { drawNewtonFractalGpu, InitWebgl2Drawing, gl } from './webgl/webgl2_drawing.js';
let cpuIterationsCount = 0;
const cpuMaxIterationsCount = 25;
const gpuMaxIterationsCount = 250;
const rootPointSize = 4.0;
const CLICK_POINT_DISTANCE = 0.125;
let plotScale = PlotScale.calculatePlotScale(window.innerWidth, window.innerHeight);
let holdingPointIndex = -1;
const TOTAL_FPS_RESET_THRESHOLD = 1000000;
let totalFps = 0;
let fpsMeasures = 0;
function getIterationsCount() {
    return parseInt(iterationsCountRange.value);
}
function resetFps() {
    totalFps = 0;
    fpsMeasures = 0;
}
function calculateFps(elapsedMs) {
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
function updateInfoPanel(drawingMode, approximate = false) {
    loggerDiv.innerHTML = `Roots count: ${roots.length}</br>
Drawing technic: ${drawingMode}</br>
<b>Average FPS: ${approximate ? '~' : ''}${Math.round(totalFps * 10 / fpsMeasures) / 10}</b>`;
}
let waitingForDrawing = false;
async function draw(drawingMode, threadsCount) {
    let iterationsCount = getIterationsCount();
    let fpsIsApproximate = false;
    if (drawingMode == undefined) {
        drawingMode = drawingModeSelect.value;
    }
    if (threadsCount == undefined) {
        threadsCount = parseInt(threadsCountRange.value);
    }
    let elapsedMs;
    if (drawingMode == DrawingModes.GpuGlslScalar) {
        elapsedMs = await drawNewtonFractalGpu(plotScale, iterationsCount, roots, regionColors);
        if (elapsedMs == -1) {
            return;
        }
        fpsIsApproximate = true;
    }
    else {
        let result = runDrawingWorkers(drawingMode, plotScale, roots, iterationsCount, regionColors, threadsCount);
        if (result == false) {
            waitingForDrawing = true;
            return;
        }
        waitingForDrawing = false;
        let drawingResult = await result;
        let data = new Uint8ClampedArray(drawingResult.data);
        let { plotScale: { x_display_range: width, y_display_range: height } } = drawingResult;
        elapsedMs = drawingResult.elapsedMs;
        let imageData = new ImageData(data, width, height);
        cpuCanvasContext.putImageData(imageData, 0, 0);
    }
    calculateFps(elapsedMs);
    updateInfoPanel(drawingMode, fpsIsApproximate);
    plotRoots(plotScale, roots);
    if (waitingForDrawing) {
        draw();
    }
}
function plotPoint(x, y, size, plotScale) {
    let [canvasX, canvasY] = transformPointToCanvasScale(x, y, plotScale);
    rootsCanvasContext.moveTo(canvasX, canvasY);
    rootsCanvasContext.beginPath();
    rootsCanvasContext.arc(canvasX, canvasY, size, 0, Math.PI * 2);
    rootsCanvasContext.fillStyle = "wheat";
    rootsCanvasContext.fill();
    rootsCanvasContext.stroke();
    rootsCanvasContext.closePath();
}
function plotRoots(plotScale, roots) {
    rootsCanvasContext.clearRect(0, 0, rootsCanvas.width, rootsCanvas.height);
    for (let [x, y] of roots) {
        plotPoint(x, y, rootPointSize, plotScale);
    }
}
function resizeCanvas(width, height) {
    rootsCanvas.width =
        gpuCanvas.width =
            cpuCanvas.width = width;
    rootsCanvas.height =
        gpuCanvas.height =
            cpuCanvas.height = height;
}
async function CanvasClick(me) {
    if (holdingPointIndex != -1)
        return;
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    let iterationsCount = getIterationsCount();
    if (me.shiftKey) {
        resetFps();
        addRoot(x, y);
    }
    else if (me.ctrlKey) {
        let { id, dst } = getClosestRoot(x, y);
        resetFps();
        roots.splice(id, 1);
    }
    else if (me.altKey) {
        let { id, dst } = getClosestRootFractalwise(x, y, iterationsCount);
        regionColors[id] = generateColor();
    }
    draw();
}
function CanvasMouseDown(me) {
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    let { id, dst } = getClosestRoot(x, y);
    if (dst < CLICK_POINT_DISTANCE && !me.shiftKey && !me.ctrlKey) {
        holdingPointIndex = id;
    }
    else {
        holdingPointIndex = -1;
    }
}
function CanvasMouseMove(me) {
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
    resizeCanvas(plotScale.x_display_range, plotScale.y_display_range);
    gl.resize();
    resetFps();
    draw();
}
let cpuCanvas = document.getElementById("cpuCanvas");
let cpuCanvasContext = cpuCanvas.getContext("2d");
let rootsCanvas = document.getElementById("rootsCanvas");
let rootsCanvasContext = rootsCanvas.getContext("2d");
let gpuCanvas = document.getElementById("gpuCanvas");
let drawingModeSelect = document.getElementById("drawingModeSelect");
let iterationsCountRange = document.getElementById("iterationsCount");
let iterationsCountDisplay = document.getElementById("iterationsCountDisplay");
let threadsCountRange = document.getElementById("threadsCount");
let threadsCountDisplay = document.getElementById("threadsCountDisplay");
let loggerDiv = document.getElementById("logger");
let changePresetButton = document.getElementById("changePresetButton");
for (const value of Object.values(DrawingModes)) {
    let option = document.createElement("option");
    option.value = value.toString();
    option.innerText = value.toString();
    drawingModeSelect.options.add(option);
}
drawingModeSelect.addEventListener('change', () => {
    let drawingMode = drawingModeSelect.value;
    if (drawingMode == DrawingModes.GpuGlslScalar) {
        cpuIterationsCount = getIterationsCount();
        iterationsCountRange.max = gpuMaxIterationsCount.toString();
        cpuCanvas.style.display = 'none';
        gpuCanvas.style.display = 'block';
        threadsCountRange.disabled = true;
    }
    else {
        iterationsCountDisplay.value = iterationsCountRange.value = cpuIterationsCount.toString();
        iterationsCountRange.max = cpuMaxIterationsCount.toString();
        cpuCanvas.style.display = 'block';
        gpuCanvas.style.display = 'none';
        threadsCountRange.disabled = false;
    }
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
    if (e.ctrlKey || e.shiftKey) {
        return;
    }
    let c = e.key.toLocaleLowerCase();
    if (c == 'c' || c == 'с') {
        changePresetButtonCallback();
    }
});
async function run() {
    InitWebgl2Drawing(gpuCanvas);
    rootsCanvas.addEventListener("mousedown", CanvasMouseDown);
    rootsCanvas.addEventListener("click", CanvasClick);
    rootsCanvas.addEventListener("mousemove", CanvasMouseMove);
    window.addEventListener("resize", WindowResize);
    iterationsCountRange.max = cpuMaxIterationsCount.toString();
    let iterationsCount = getIterationsCount();
    cpuIterationsCount = iterationsCount;
    let firstDraw = runDrawingWorkers(drawingModeSelect.value, plotScale, roots, iterationsCount, regionColors);
    firstDraw.then(async () => {
        WindowResize();
        await InitWebgl2Drawing(gpuCanvas);
        await drawNewtonFractalGpu(plotScale, getIterationsCount(), roots, regionColors);
    });
}
run();
//# sourceMappingURL=ui_logic.js.map