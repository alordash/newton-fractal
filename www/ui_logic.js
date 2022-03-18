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
loggerDiv.innerHTML = `Drawing technic: ${0}</br>
    Calculation in process...</br>
    <b>FPS: ...</b>`;
loggerDiv.innerHTML = `Drawing technic: ${0}</br>
Took: ${0}ms</br>
<b>FPS: ${0}</b>`;
function resizeCanvas(width, height) {
    mainCanvas.width = width;
    mainCanvas.height = height;
}
async function CanvasClick(me) {
    if (holdingPointIndex != -1)
        return;
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    if (me.shiftKey) {
        addRoot(x, y);
    }
    else if (me.ctrlKey) {
        let { id, dst } = getClosestRoot(x, y);
        roots.splice(id, 1);
    }
    let iterationsCount = parseInt(iterationsCountRange.value);
    let result = runDrawingWorkers(plotScale, roots, iterationsCount, regionColors);
    if (result == false) {
        console.log(`Error running drawing workers`);
    }
    else {
        console.log(`Waiting for drawing completion`);
        let data = await result;
        console.log('returned data :>> ', data);
        data = new Uint8ClampedArray(data);
        let { x_display_range: width, y_display_range: height } = plotScale;
        console.log('data.length :>> ', data.length, ', width :>> ', width, ', height :>> ', height);
        let imageData = new ImageData(data, width, height);
        mainCanvasContext.putImageData(imageData, 0, 0);
        console.log(`Drawing completed`);
    }
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
}
function WindowResize() {
    let { innerWidth, innerHeight } = window;
    plotScale = PlotScale.calculatePlotScale(innerWidth, innerHeight);
    resizeCanvas(plotScale.x_display_range, plotScale.y_display_range);
}
console.log('DrawingModes :>> ', DrawingModes);
console.log('Object.(DrawingModes) :>> ', Object.values(DrawingModes));
for (const value of Object.values(DrawingModes)) {
    let option = document.createElement("option");
    option.value = value.toString();
    option.innerText = value.toString();
    drawingModeSelect.options.add(option);
}
iterationsCountDisplay.value = iterationsCountRange.value;
iterationsCountRange.addEventListener("change", () => {
    iterationsCountDisplay.value = iterationsCountRange.value;
});
async function run() {
    let sharedMemory = new WebAssembly.Memory({ initial: 100, maximum: 1000, shared: true });
    mainCanvas.addEventListener("mousedown", CanvasMouseDown);
    mainCanvas.addEventListener("click", CanvasClick);
    mainCanvas.addEventListener("mousemove", CanvasMouseMove);
    window.addEventListener("resize", WindowResize);
    WindowResize();
}
run();
//# sourceMappingURL=ui_logic.js.map