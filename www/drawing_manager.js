const { create_u32_buffer, free_u32_buffer } = wasm_bindgen;
const WASM_MODULE_SOURCE_PATH = '../pkg/newton_fractal_bg.wasm';
let wasmModule;
const DRAWING_WORKER_SOURCE_PATH = 'drawing_worker.js';
let drawingWorkersCount = navigator.hardwareConcurrency;
let drawingWorkers = [];
let readyWorkersCount = 0;
let drawingWorkersInitResolve;
let drawingWorkersInitPromise = new Promise((resolve, _) => {
    drawingWorkersInitResolve = resolve;
});
var DrawingModes;
(function (DrawingModes) {
    DrawingModes["CpuWasmSimd"] = "CPU-wasm-simd";
    DrawingModes["CpuWasmScalar"] = "CPU-wasm-scalar";
    DrawingModes["CpuJsScalar"] = "CPU-js-scalar";
})(DrawingModes || (DrawingModes = {}));
class DrawingWork {
    constructor(drawingMode, plotScale, bufferPtr, bufferSize) {
        this.drawingMode = drawingMode;
        this.plotScale = plotScale;
        this.bufferPtr = bufferPtr;
        this.bufferSize = bufferSize;
        this.promise = new Promise((resolve, _) => {
            this.promiseResolve = resolve;
        });
    }
}
let drawingWork;
const drawingWorkerDrawingCallback = async function (ev) {
    let now = performance.now();
    readyWorkersCount++;
    if (readyWorkersCount == drawingWorkersCount) {
        let data = new Uint8ClampedArray(wasmModule.memory.buffer, drawingWork.bufferPtr, drawingWork.bufferSize);
        let drawingResult = {
            elapsedMs: now - drawingWork.startTime,
            drawingMode: drawingWork.drawingMode,
            plotScale: drawingWork.plotScale,
            data,
        };
        drawingWork.promiseResolve(drawingResult);
        free_u32_buffer(drawingWork.bufferSize / 4, drawingWork.bufferPtr);
        drawingWork = undefined;
    }
};
const drawingWorkerInitCallback = function (ev) {
    let workerId = ev.data;
    drawingWorkers[workerId].onmessage = drawingWorkerDrawingCallback;
    readyWorkersCount++;
    console.log(`Worker #${workerId} initialized`);
    if (readyWorkersCount == drawingWorkersCount) {
        console.log(`All workers are initialized`);
        drawingWorkersInitResolve(undefined);
        drawingWorkersInitPromise = undefined;
    }
};
function createDrawingWorker(sourcePath) {
    let worker = new Worker(sourcePath);
    worker.onmessage = drawingWorkerInitCallback;
    return worker;
}
function initializeWorkers(sharedMemory) {
    for (let i = 0; i < drawingWorkersCount; i++) {
        let drawingWorker = createDrawingWorker(DRAWING_WORKER_SOURCE_PATH);
        drawingWorkers.push(drawingWorker);
    }
    for (let i = 0; i < drawingWorkersCount; i++) {
        drawingWorkers[i].postMessage({ workerId: i, sharedMemory });
    }
}
async function initializeDrawing() {
    let sharedMemory = new WebAssembly.Memory({ initial: 100, maximum: 1000, shared: true });
    wasmModule = await wasm_bindgen(WASM_MODULE_SOURCE_PATH, sharedMemory);
    initializeWorkers(sharedMemory);
}
function runDrawingWorkers(drawingMode, plotScale, roots, iterationsCount, colors, threadsCount = drawingWorkersCount) {
    if (drawingWorkersInitPromise != undefined) {
        return drawingWorkersInitPromise;
    }
    if (readyWorkersCount != drawingWorkersCount) {
        return false;
    }
    let drawingModeId = Object.values(DrawingModes).indexOf(drawingMode);
    let { x_display_range: width, y_display_range: height } = plotScale;
    let u32BufferSize = width * height;
    let bufferPtr = wasm_bindgen.create_u32_buffer(u32BufferSize);
    drawingWork = new DrawingWork(drawingMode, plotScale, bufferPtr, u32BufferSize * 4);
    readyWorkersCount -= threadsCount;
    drawingWork.startTime = performance.now();
    for (let i = 0; i < threadsCount; i++) {
        drawingWorkers[i].postMessage({ drawingModeId, plotScale, roots, iterationsCount, colors, partOffset: i, partsCount: threadsCount, bufferPtr });
    }
    return drawingWork.promise;
}
initializeDrawing();
export { runDrawingWorkers };
//# sourceMappingURL=drawing_manager.js.map