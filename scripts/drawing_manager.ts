import { PlotScale } from "./plotter";

const DRAWING_WORKER_SOURCE_PATH = 'drawing_worker.js';

let drawingWorkersCount = navigator.hardwareConcurrency;
let drawingWorkers: Worker[] = [];
let readyWorkersCount = 0;

let drawingResultPromise: Promise<number>;
let drawingResultPromiseResolve: (value: unknown) => void;

function createDrawingResultPromise() {
    drawingResultPromise = new Promise((resolve, _) => {
        drawingResultPromiseResolve = resolve;
    })
}

const drawingWorkerCallback = async function (ev: MessageEvent<{ workerId: number }>) {
    let data = ev.data;
    let id = data.workerId;
    readyWorkersCount++;

    if (readyWorkersCount == drawingWorkersCount) {
        let data = 10;
        drawingResultPromiseResolve(data);
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
        drawingWorkers[i].postMessage(sharedMemory);
    }
}

async function initializeDrawing() {
    let sharedMemory = new WebAssembly.Memory({ initial: 100, maximum: 1000, shared: true });
    await wasm_bindgen(undefined, sharedMemory);
    initializeWorkers(sharedMemory);
}

async function runDrawingWorkers(plotScale: PlotScale, roots: number[][], iterationsCount: number, colors: number[][], concurrency = 1) {
    if (drawingResultPromise != undefined) {
        return false;
    }
    createDrawingResultPromise();

    for (let i = 0; i < concurrency; i++) {
        drawingWorkers[i].postMessage({ plotScale, roots, iterationsCount, colors });
    }

    return drawingResultPromise;
}

initializeDrawing();