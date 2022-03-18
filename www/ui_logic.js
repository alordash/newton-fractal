import { regionColors } from './colors.js';
import { transformPointToPlotScale, transformPointToCanvasScale } from './newtons_fractal.js';
import { PlotScale, roots, addRoot, getClosestRoot } from './plotter.js';
import { runDrawingWorkers } from './drawing_manager.js';
var DrawingModes;
(function (DrawingModes) {
    DrawingModes["CpuWasmSimd"] = "CPU-wasm-simd";
    DrawingModes["CpuWasmScalar"] = "CPU-wasm-scalar";
    DrawingModes["CpuJsScalar"] = "CPU-js-scalar";
})(DrawingModes || (DrawingModes = {}));
const rootPointSize = 4.0;
let plotScale = PlotScale.calculatePlotScale(window.innerWidth, window.innerHeight);
const CLICK_POINT_DISTANCE = 0.125;
let holdingPointIndex = -1;
const TOTAL_FPS_RESET_THRESHOLD = 1000000;
let totalFps = 0;
let fpsMeasures = 0;
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
async function draw(drawingMode = drawingModeSelect.value) {
    let iterationsCount = parseInt(iterationsCountRange.value);
    loggerDiv.innerHTML = `Roots count: ${roots.length}</br>
———————————</br>
Drawing technic: ${drawingMode}</br>
<b>Average FPS: ${Math.round(totalFps * 10 / fpsMeasures) / 10}</b>`;
    let result = runDrawingWorkers(drawingMode, plotScale, roots, iterationsCount, regionColors);
    if (result == false) {
        return;
    }
    let drawingResult = await result;
    let data = new Uint8ClampedArray(drawingResult.data);
    let { elapsedMs, plotScale: { x_display_range: width, y_display_range: height } } = drawingResult;
    calculateFps(elapsedMs);
    loggerDiv.innerHTML = `Roots count: ${roots.length}</br>
———————————</br>
Drawing technic: ${drawingMode}</br>
<b>Average FPS: ${Math.round(totalFps * 10 / fpsMeasures) / 10}</b>`;
    let imageData = new ImageData(data, width, height);
    mainCanvasContext.putImageData(imageData, 0, 0);
    plotRoots(plotScale, roots);
}
let mainCanvas = document.getElementById("main-canvas");
let mainCanvasContext = mainCanvas.getContext("2d");
let drawingModeSelect = document.getElementById("drawingModeSelect");
let iterationsCountRange = document.getElementById("iterationsCount");
let iterationsCountDisplay = document.getElementById("iterationsCountDisplay");
let loggerDiv = document.getElementById("logger");
function plotPoint(x, y, size, plotScale) {
    let [canvasX, canvasY] = transformPointToCanvasScale(x, y, plotScale);
    mainCanvasContext.moveTo(canvasX, canvasY);
    mainCanvasContext.beginPath();
    mainCanvasContext.arc(canvasX, canvasY, size, 0, Math.PI * 2);
    mainCanvasContext.fillStyle = "wheat";
    mainCanvasContext.fill();
    mainCanvasContext.stroke();
    mainCanvasContext.closePath();
}
function plotRoots(plotScale, roots) {
    for (let [x, y] of roots) {
        plotPoint(x, y, rootPointSize, plotScale);
    }
}
function resizeCanvas(width, height) {
    mainCanvas.width = width;
    mainCanvas.height = height;
}
async function CanvasClick(me) {
    if (holdingPointIndex != -1)
        return;
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    if (me.shiftKey) {
        resetFps();
        addRoot(x, y);
    }
    else if (me.ctrlKey) {
        resetFps();
        let { id, dst } = getClosestRoot(x, y);
        roots.splice(id, 1);
    }
    draw();
}
function CanvasMouseDown(me) {
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    let { id, dst } = getClosestRoot(x, y);
    if (dst < CLICK_POINT_DISTANCE) {
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
    draw();
}
console.log('DrawingModes :>> ', DrawingModes);
console.log('Object.(DrawingModes) :>> ', Object.values(DrawingModes));
for (const value of Object.values(DrawingModes)) {
    let option = document.createElement("option");
    option.value = value.toString();
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
async function run() {
    mainCanvas.addEventListener("mousedown", CanvasMouseDown);
    mainCanvas.addEventListener("click", CanvasClick);
    mainCanvas.addEventListener("mousemove", CanvasMouseMove);
    window.addEventListener("resize", WindowResize);
    let iterationsCount = parseInt(iterationsCountRange.value);
    let firstDraw = runDrawingWorkers(drawingModeSelect.value, plotScale, roots, iterationsCount, regionColors);
    firstDraw.then(() => WindowResize());
}
run();
//# sourceMappingURL=ui_logic.js.map