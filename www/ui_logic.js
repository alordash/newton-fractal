import { regionColors } from './colors.js';
import { WorkerCommands, DrawingModes } from './drawing_worker.js';
import { transformPointToPlotScale, transformPointToCanvasScale } from './newtons_fractal.js';
import { PlotScale, roots, addRoot, getClosestRoot } from './plotter.js';
const rootPointSize = 4.0;
let plotScale = PlotScale.calculatePlotScale(window.innerWidth, window.innerHeight);
const CLICK_POINT_DISTANCE = 0.125;
let holdingPointIndex = -1;
let drawingWorker;
function sendMessageToWorker(message) {
    drawingWorker.postMessage(message);
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
function formDrawingConfig(drawingMode = drawingModeSelect.value) {
    let iterationsCount = parseInt(iterationsCountRange.value);
    return {
        drawingMode,
        plotScale,
        roots,
        iterationsCount,
        regionColors
    };
}
let doneDrawing = true;
function runDrawingWorker(drawingMode = drawingModeSelect.value) {
    let drawingConfig = formDrawingConfig(drawingMode);
    loggerDiv.innerHTML = `Drawing technic: ${drawingMode}</br>
    Calculation in process...</br>
    <b>FPS: ...</b>`;
    doneDrawing = false;
    sendMessageToWorker({
        command: WorkerCommands.Draw,
        drawingConfig
    });
}
function drawingCallback(drawingResult) {
    let { elapsedMs, drawingMode, imageData } = drawingResult;
    let fps = 1000 / elapsedMs;
    let precisionPower = 10;
    if (fps < 1) {
        precisionPower = 100;
    }
    fps = Math.round(fps * precisionPower) / precisionPower;
    loggerDiv.innerHTML = `Drawing technic: ${drawingMode}</br>
Took: ${elapsedMs}ms</br>
<b>FPS: ${fps}</b>`;
    mainCanvasContext.putImageData(imageData, 0, 0);
    plotRoots(plotScale, roots);
    doneDrawing = true;
    if (awaitingForResize) {
        WindowResize();
    }
}
function resizeCanvas(width, height) {
    mainCanvas.width = width;
    mainCanvas.height = height;
}
function drawingWorkerCallback(e) {
    let { data } = e;
    let command = data.command;
    switch (command) {
        case WorkerCommands.Init:
            WindowResize();
            break;
        case WorkerCommands.Draw:
            drawingCallback(data.drawingResult);
            break;
        default:
            break;
    }
}
function CanvasClick(me) {
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
    runDrawingWorker();
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
    if (doneDrawing) {
        let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
        roots[holdingPointIndex] = [x, y];
        runDrawingWorker();
    }
}
let awaitingForResize = false;
function WindowResize() {
    let { innerWidth, innerHeight } = window;
    if (doneDrawing) {
        awaitingForResize = false;
        plotScale = PlotScale.calculatePlotScale(innerWidth, innerHeight);
        let drawingConfig = formDrawingConfig();
        resizeCanvas(drawingConfig.plotScale.x_display_range, drawingConfig.plotScale.y_display_range);
        runDrawingWorker();
    }
    else {
        awaitingForResize = true;
    }
}
for (const value of Object.values(DrawingModes)) {
    let option = document.createElement("option");
    option.value = value;
    option.innerText = value;
    drawingModeSelect.options.add(option);
}
iterationsCountDisplay.value = iterationsCountRange.value;
iterationsCountRange.addEventListener("change", () => {
    iterationsCountDisplay.value = iterationsCountRange.value;
    runDrawingWorker();
});
async function run() {
    drawingWorker = new Worker("drawing_worker.js", { type: 'module' });
    drawingWorker.onmessage = drawingWorkerCallback;
    let { innerWidth, innerHeight } = window;
    sendMessageToWorker({
        command: WorkerCommands.Init
    });
    mainCanvas.addEventListener("mousedown", CanvasMouseDown);
    mainCanvas.addEventListener("click", CanvasClick);
    mainCanvas.addEventListener("mousemove", CanvasMouseMove);
    window.addEventListener("resize", WindowResize);
}
run();
//# sourceMappingURL=ui_logic.js.map