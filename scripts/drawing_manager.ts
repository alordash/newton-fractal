import { PlotScale } from "./plotter";
const { create_u32_buffer, free_u32_buffer } = wasm_bindgen;

const WASM_MODULE_SOURCE_PATH = '../pkg/newton_fractal_bg.wasm';
let wasmModule: InitOutput;

const DRAWING_WORKER_SOURCE_PATH = 'drawing_worker.js';

let drawingWorkersCount = navigator.hardwareConcurrency;
let drawingWorkers: Worker[] = [];
let readyWorkersCount = 0;

enum DrawingModes {
    CpuWasmSimd = "CPU-wasm-simd",
    CpuWasmScalar = "CPU-wasm-scalar",
    CpuJsScalar = "CPU-js-scalar"
}

type DrawingResult = {
    elapsedMs: number,
    drawingMode: DrawingModes,
    plotScale: PlotScale,
    data: Uint8ClampedArray,
}

class DrawingWork {
    bufferPtr: number;
    bufferSize: number;
    drawingMode: DrawingModes;
    plotScale: PlotScale;

    startTime: number;
    promise: Promise<DrawingResult>;
    promiseResolve: (value: DrawingResult) => void;

    constructor(drawingMode: DrawingModes, plotScale: PlotScale, bufferPtr: number, bufferSize: number) {
        this.drawingMode = drawingMode;
        this.plotScale = plotScale;

        this.bufferPtr = bufferPtr;
        this.bufferSize = bufferSize;
        this.promise = new Promise((resolve, _) => {
            this.promiseResolve = resolve;
        });
    }
}

let drawingWork: DrawingWork;

const drawingWorkerCallback = async function (ev: MessageEvent<{ workerId: number, doneDrawing: boolean }>) {
    let now = Date.now();

    let message = ev.data;
    let { workerId, doneDrawing } = message;

    readyWorkersCount++;

    if (!doneDrawing) {
        console.log(`Worker #${workerId} initialized`);
        return;
    }
    // console.log(`Worker #${workerId} done drawing`);

    if (readyWorkersCount == drawingWorkersCount) {
        let data = new Uint8ClampedArray(wasmModule.memory.buffer, drawingWork.bufferPtr, drawingWork.bufferSize);
        let drawingResult: DrawingResult = {
            elapsedMs: now - drawingWork.startTime,
            drawingMode: drawingWork.drawingMode,
            plotScale: drawingWork.plotScale,
            data,
        };
        drawingWork.promiseResolve(drawingResult);

        free_u32_buffer(drawingWork.bufferSize / 4, drawingWork.bufferPtr);
        drawingWork = undefined;
    }
}

function createDrawingWorker(sourcePath: string | URL) {
    let worker = new Worker(sourcePath);
    worker.onmessage = drawingWorkerCallback;
    return worker;
}

function initializeWorkers(sharedMemory: WebAssembly.Memory) {
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

function runDrawingWorkers(drawingMode: DrawingModes, plotScale: PlotScale, roots: number[][], iterationsCount: number, colors: number[][], concurrency = drawingWorkersCount) {
    if (drawingWork != undefined || readyWorkersCount != drawingWorkersCount) {
        return false;
    }

    let drawingModeId = Object.values(DrawingModes).indexOf(drawingMode);
    let { x_display_range: width, y_display_range: height } = plotScale;

    let u32BufferSize = width * height;
    let bufferPtr = wasm_bindgen.create_u32_buffer(u32BufferSize);
    drawingWork = new DrawingWork(drawingMode, plotScale, bufferPtr, u32BufferSize * 4);

    readyWorkersCount -= concurrency;
    drawingWork.startTime = Date.now();
    for (let i = 0; i < concurrency; i++) {
        drawingWorkers[i].postMessage({ drawingModeId, plotScale, roots, iterationsCount, colors, partOffset: i, partsCount: concurrency, bufferPtr });
    }

    return drawingWork.promise;
}

initializeDrawing();

export {
    DrawingResult,
    runDrawingWorkers
};