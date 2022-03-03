import init, { fill_pixels, fill_pixels_simd } from '../pkg/newton_fractal.js';
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

    let data: Uint8ClampedArray;
    let start: Date, end: Date;
    switch (drawingMode) {
        case DrawingModes.CPU_JS_SCALAR:
            start = new Date();
            data = fillPixelsJavascript(plotScale, roots, iterationsCount, regionColors);
            end = new Date();
            break;
        case DrawingModes.CPU_WASM_SCALAR:
            start = new Date();
            data = fill_pixels(plotScale, roots, iterationsCount, regionColors);
            end = new Date();
            break;
        case DrawingModes.CPU_WASM_SIMD:
            start = new Date();
            data = fill_pixels_simd(plotScale, roots, iterationsCount, regionColors);
            end = new Date();
            break;

        default:
            break;
    }
    let imageData = new ImageData(data, plotScale.x_display_range, plotScale.y_display_range);
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