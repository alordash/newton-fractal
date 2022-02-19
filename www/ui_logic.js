import { regionColors } from './colors.js';
import { WorkerCommands, DrawingModes } from './drawing_worker.js';
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
function formDrawingConfig(drawingMode = drawingModeSelect.value) {
    let iterationsCount = parseInt(iterationsCountRange.value);
    return {
        drawingMode,
        iterationsCount,
        regionColors
    };
}
function runDrawingWorker(drawingMode = drawingModeSelect.value) {
    let drawingConfig = formDrawingConfig(drawingMode);
    loggerDiv.innerHTML = `Drawing technic: ${drawingMode}</br>
    Took: ...ms</br>
    <b>FPS: ...</b>`;
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
    console.log(`Done drawing, took: ${elapsedMs}ms`);
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
        case WorkerCommands.Resize:
            let { width, height } = data.dimension;
            resizeCanvas(width, height);
            runDrawingWorker(DrawingModes.CPU_WASM_SIMD);
            break;
        case WorkerCommands.Draw:
            drawingCallback(data.drawingResult);
            break;
        default:
            break;
    }
}
function CanvasClick(me) {
    runDrawingWorker();
}
function CanvasMouseDown(me) {
}
function CanvasMouseMove(me) {
}
function WindowResize() {
    let { innerWidth, innerHeight } = window;
    console.log(`Resizing (${innerWidth}, ${innerHeight})`);
    let drawingConfig = formDrawingConfig();
    sendMessageToWorker({
        command: WorkerCommands.Resize,
        initConfig: {
            innerWidth,
            innerHeight
        },
        drawingConfig
    });
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
        command: WorkerCommands.Init,
        initConfig: {
            innerWidth, innerHeight
        }
    });
    mainCanvas.addEventListener("mousedown", CanvasMouseDown);
    mainCanvas.addEventListener("click", CanvasClick);
    mainCanvas.addEventListener("mousemove", CanvasMouseMove);
    window.addEventListener("resize", WindowResize);
}
run();
//# sourceMappingURL=ui_logic.js.map