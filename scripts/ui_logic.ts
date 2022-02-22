import { generateColor, regionColors } from './colors.js';
import {
    WorkerCommands,
    DrawingModes,
    DrawingConfig,
    DrawingResult,
    WorkerMessage,
    WorkerResult
} from './drawing_worker.js';
import { PlotScale, roots } from './plotter.js';

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

function formDrawingConfig(drawingMode: DrawingModes = <DrawingModes>drawingModeSelect.value): DrawingConfig {
    let iterationsCount = parseInt(iterationsCountRange.value);
    let plotScale = PlotScale.calculatePlotScale(window.innerWidth, window.innerHeight);
    return {
        drawingMode,
        plotScale,
        roots,
        iterationsCount,
        regionColors
    };
}

function runDrawingWorker(drawingMode: DrawingModes = <DrawingModes>drawingModeSelect.value) {
    let drawingConfig = formDrawingConfig(drawingMode);

    loggerDiv.innerHTML = `Drawing technic: ${drawingMode}</br>
    Took: ...ms</br>
    <b>FPS: ...</b>`;

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

    // if (enableLogging) {
    mainCanvasContext.putImageData(imageData, 0, 0);
    console.log(`Done drawing, took: ${elapsedMs}ms`);
    // }
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
        case WorkerCommands.Draw:
            drawingCallback(data.drawingResult);
            break;

        default:
            break;
    }
}

function CanvasClick(me: MouseEvent) {
    // if (holdingPointIndex != -1) return;
    // let [x, y] = mapPoints(plotter, me.offsetX, me.offsetY);

    // if (me.shiftKey) {
    //     addRoot(x, y);
    // } else if (me.ctrlKey) {
    //     let [idx, _] = polynom.get_closest_root_id(x, y);
    //     polynom.remove_root_by_id(idx);
    // }

    runDrawingWorker();
}

function CanvasMouseDown(me: MouseEvent) {
    // let [x, y] = mapPoints(plotter, me.offsetX, me.offsetY);

    // let [idx, dst] = polynom.get_closest_root_id(x, y);
    // if (dst < CLICK_POINT_DISTANCE) {
    //     holdingPointIndex = idx;
    // } else {
    //     holdingPointIndex = -1;
    // }
}

function CanvasMouseMove(me: MouseEvent) {
    // if (holdingPointIndex == -1) return;
    // if (me.buttons != 1) {
    //     holdingPointIndex = -1;
    //     return;
    // }

    // let [x, y] = mapPoints(plotter, me.offsetX, me.offsetY);
    // polynom.set_root_by_id(holdingPointIndex, x, y);

    // draw(false)
}

function WindowResize() {
    let { innerWidth, innerHeight } = window;

    console.log(`Resizing (${innerWidth}, ${innerHeight})`);
    let drawingConfig = formDrawingConfig();
    mainCanvas.width = drawingConfig.plotScale.x_display_range;
    mainCanvas.height = drawingConfig.plotScale.y_display_range;
    sendMessageToWorker({
        command: WorkerCommands.Draw,
        drawingConfig
    });
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