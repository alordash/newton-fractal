import init, { fill_pixels_nalgebra, fill_pixels_simd_nalgebra } from '../pkg/newton_fractal.js';
import { fillPixelsJavascript } from './newtons_fractal.js';
import { PlotScale } from './plotter.js';

enum WorkerCommands {
    Init,
    Draw,
}

enum DrawingModes {
    CPU_WASM_SIMD = "CPU-wasm-simd",
    CPU_WASM_SCALAR = "CPU-wasm-scalar",
    CPU_JS_SCALAR = "CPU-js-scalar",
}

type DrawingConfig = {
    drawingMode: DrawingModes,
    plotScale: PlotScale,
    roots: number[][],
    iterationsCount: number,
    regionColors: number[][]
}

type DrawingResult = {
    drawingMode: DrawingModes,
    elapsedMs: number,
    imageData: ImageData
}

type WorkerMessage = {
    command: WorkerCommands,
    drawingConfig?: DrawingConfig,
}

type WorkerResult = {
    command: WorkerCommands,
    drawingResult?: DrawingResult
}

function draw(config: DrawingConfig): DrawingResult {
    let { plotScale, roots, drawingMode, iterationsCount, regionColors } = config;

    let imageData: ImageData;
    let start = new Date();
    switch (drawingMode) {
        case DrawingModes.CPU_JS_SCALAR:
            imageData = fillPixelsJavascript(plotScale, roots, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SCALAR:
            imageData = fill_pixels_nalgebra(plotScale, roots, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SIMD:
            imageData = fill_pixels_simd_nalgebra(plotScale, roots, iterationsCount, regionColors);
            break;

        default:
            break;
    }
    let end = new Date();
    let elapsedMs = end.getTime() - start.getTime();
    return { drawingMode, elapsedMs, imageData };
}

function postCustomMessage(message: WorkerResult) {
    postMessage(message);
}

onmessage = async function (e: MessageEvent<WorkerMessage>) {
    let { data } = e;
    let command = data.command;

    switch (command) {
        case WorkerCommands.Init:
            {
                await init();
                postCustomMessage({
                    command
                });
            }
            break;
        case WorkerCommands.Draw:
            {
                let { drawingConfig } = data;
                let drawingResult = draw(drawingConfig);
                postCustomMessage({
                    command,
                    drawingResult
                });
            }
            break;
        default:
            break;
    }
}

export {
    WorkerCommands,
    DrawingModes,
    DrawingConfig,
    DrawingResult,
    WorkerMessage,
    WorkerResult
}