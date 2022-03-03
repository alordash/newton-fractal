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
    initSharedMemory?: WebAssembly.Memory,
    drawingConfig?: DrawingConfig,
}

type WorkerResult = {
    command: WorkerCommands,
    drawingResult?: DrawingResult
}

function draw(config: DrawingConfig): DrawingResult {
    let { plotScale, roots, drawingMode, iterationsCount, regionColors } = config;

    let length = plotScale.x_display_range * plotScale.y_display_range * 4;
    let coresCount = navigator.hardwareConcurrency;
    // let coresCount = 8;
    console.log('coresCount :>> ', coresCount);
    let step = Math.floor(length / coresCount);
    let data: Uint8ClampedArray = new Uint8ClampedArray(length);
    console.log('length :>> ', length);
    let start: Date, end: Date;
    for (let i = 0; i < coresCount; i++) {
        let new_data: Uint8ClampedArray;
        const offset = step * i;
        switch (drawingMode) {
            case DrawingModes.CPU_JS_SCALAR:
                start = new Date();
                new_data = fillPixelsJavascript(plotScale, roots, iterationsCount, regionColors);
                end = new Date();
                break;
            case DrawingModes.CPU_WASM_SCALAR:
                start = new Date();
                new_data = fill_pixels(plotScale, roots, iterationsCount, regionColors, i, coresCount);
                end = new Date();
                break;
            case DrawingModes.CPU_WASM_SIMD:
                start = new Date();
                new_data = fill_pixels_simd(plotScale, roots, iterationsCount, regionColors);
                end = new Date();
                break;

            default:
                break;
        }
        console.log('new_data.length :>> ', new_data.length);
        console.log('offset :>> ', offset, ', step :>> ', step);
        for (let j = 0; j < new_data.length; j++) {
            data[j + offset] = new_data[j];
        }
    }
    let imageData = new ImageData(data, plotScale.x_display_range, plotScale.y_display_range);
    let elapsedMs = end.getTime() - start.getTime();
    return { drawingMode, elapsedMs, imageData };
}

function postCustomMessage(message: WorkerResult) {
    postMessage(message, undefined);
}

onmessage = async function (e: MessageEvent<WorkerMessage>) {
    let { data } = e;
    let { command } = data;

    switch (command) {
        case WorkerCommands.Init:
            {
                await init(undefined, data.initSharedMemory);
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