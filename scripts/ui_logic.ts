import { generateColor, regionColors } from './colors.js';
import {
    WorkerCommands,
    DrawingModes,
    DrawingConfig,
    DrawingResult,
    WorkerMessage,
    WorkerResult
} from './drawing_worker.js';
import { transformPointToPlotScale, transformPointToCanvasScale } from './newtons_fractal.js';
import { PlotScale, roots, addRoot, getClosestRoot } from './plotter.js';
import init from '../pkg/newton_fractal.js';

const rootPointSize = 4.0;

let plotScale = PlotScale.calculatePlotScale(window.innerWidth, window.innerHeight);
const CLICK_POINT_DISTANCE = 0.125;
let holdingPointIndex = -1;

let drawingWorker: Worker;

function sendMessageToWorker(message: WorkerMessage) {
    drawingWorker.postMessage(message);
}

let mainCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
let mainCanvasContext = mainCanvas.getContext("2d");
let drawingModeSelect = <HTMLSelectElement>document.getElementById("drawingModeSelect");
let iterationsCountRange = <HTMLInputElement>document.getElementById("iterationsCount");
let iterationsCountDisplay = <HTMLOutputElement>document.getElementById("iterationsCountDisplay");
let loggerDiv = document.getElementById("logger");

function plotPoint(x: number, y: number, size: number, plotScale: PlotScale) {
    let [canvasX, canvasY] = transformPointToCanvasScale(x, y, plotScale);
    mainCanvasContext.moveTo(canvasX, canvasY);
    mainCanvasContext.beginPath();
    mainCanvasContext.arc(canvasX, canvasY, size, 0, Math.PI * 2);
    mainCanvasContext.fillStyle = "wheat";
    mainCanvasContext.fill();
    mainCanvasContext.stroke();
    mainCanvasContext.closePath();
}

function plotRoots(plotScale: PlotScale, roots: number[][]) {
    for (let [x, y] of roots) {
        plotPoint(x, y, rootPointSize, plotScale);
    }
}

function formDrawingConfig(drawingMode: DrawingModes = <DrawingModes>drawingModeSelect.value): DrawingConfig {
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
function runDrawingWorker(drawingMode: DrawingModes = <DrawingModes>drawingModeSelect.value) {
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

function drawingCallback(drawingResult: DrawingResult) {
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
    // console.log(`Done drawing using "${drawingMode}", took: ${elapsedMs}ms`);
    plotRoots(plotScale, roots);
    doneDrawing = true;
}

function resizeCanvas(width: number, height: number) {
    mainCanvas.width = width;
    mainCanvas.height = height;
}

function drawingWorkerCallback(e: MessageEvent<WorkerResult>) {
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

function CanvasClick(me: MouseEvent) {
    if (holdingPointIndex != -1) return;
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);

    if (me.shiftKey) {
        addRoot(x, y);
    } else if (me.ctrlKey) {
        let { id, dst } = getClosestRoot(x, y);
        roots.splice(id, 1);
    }

    runDrawingWorker();
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

    if (doneDrawing) {
        let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
        roots[holdingPointIndex] = [x, y];

        runDrawingWorker();
    }
}

function WindowResize() {
    let { innerWidth, innerHeight } = window;

    console.log(`Resizing (${innerWidth}, ${innerHeight})`);
    plotScale = PlotScale.calculatePlotScale(innerWidth, innerHeight);
    let drawingConfig = formDrawingConfig();
    resizeCanvas(
        drawingConfig.plotScale.x_display_range,
        drawingConfig.plotScale.y_display_range
    );
    runDrawingWorker();
}

for (const value of Object.values(DrawingModes)) {
    let option = <HTMLOptionElement>document.createElement("option");
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
    // drawingWorker.postMessage()
    // await init();


    mainCanvas.addEventListener("mousedown", CanvasMouseDown)
    mainCanvas.addEventListener("click", CanvasClick);
    mainCanvas.addEventListener("mousemove", CanvasMouseMove);

    window.addEventListener("resize", WindowResize);

    // runDrawingWorker(true);
}

run();