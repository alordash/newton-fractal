import init, { DrawingConfig as DC, fill_pixels_js, fill_pixels_simd_js, InitOutput, PlotScale as PS } from '../pkg/newton_fractal.js';
import { fillPixelsJavascript } from './newtons_fractal.js';
import { PlotScale } from './plotter.js';

enum DrawingModes {
    CpuWasmSimd = "CPU-wasm-simd",
    CpuWasmScalar = "CPU-wasm-scalar",
    CpuJsScalar = "CPU-js-scalar"
}

enum WorkerCommands {
    Init,
    Draw,
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
    // let coresCount = navigator.hardwareConcurrency;
    let coresCount = 2;
    console.log('coresCount :>> ', coresCount);
    let step = Math.floor(length / coresCount);
    let data: Uint8ClampedArray = new Uint8ClampedArray(length);
    let sumLength = 0;
    let start: Date, end: Date;
    for (let i = 0; i < coresCount; i++) {
        let new_data: Uint8ClampedArray;
        switch (drawingMode) {
            case DrawingModes.CpuJsScalar:
                start = new Date();
                new_data = fillPixelsJavascript(plotScale, roots, iterationsCount, regionColors);
                end = new Date();
                break;
            case DrawingModes.CpuWasmScalar:
                start = new Date();
                new_data = fill_pixels_js(plotScale, roots, iterationsCount, regionColors, i, coresCount);
                end = new Date();
                break;
            case DrawingModes.CpuWasmSimd:
                start = new Date();
                new_data = fill_pixels_simd_js(plotScale, roots, iterationsCount, regionColors);
                end = new Date();
                break;

            default:
                console.log(`UNKNOWN DRAWING MODE`);
                break;
        }
        for (let j = 0; j < new_data.length; j++) {
            data[j + sumLength] = new_data[j];
        }
        sumLength += new_data.length;
    }
    let imageData = new ImageData(data, plotScale.x_display_range, plotScale.y_display_range);
    let elapsedMs = end.getTime() - start.getTime();
    return { drawingMode, elapsedMs, imageData };
}

function postCustomMessage(message: WorkerResult) {
    postMessage(message, undefined);
}

const workersCount = navigator.hardwareConcurrency;
let workers: Worker[] = [];

let mod: InitOutput;

function testWorkerCallback(e: MessageEvent<any>) {
    console.log('Message from test worker :>> ', e.data);
}

function createDrawingWorker(uri: string | URL, wasmMemory: WebAssembly.Memory): Worker {
    let worker = new Worker(uri, { type: 'module' });
    worker.onmessage = testWorkerCallback;
    worker.postMessage({ init: true, wasmMemory });
    console.log('new test worker :>> ', worker);
    return worker;
}

onmessage = async function (e: MessageEvent<WorkerMessage>) {
    let { data } = e;
    let { command } = data;

    console.log('JS WORKER got data :>> ', data);

    switch (command) {
        case WorkerCommands.Init:
            {
                mod = await init(undefined, data.initSharedMemory);
                postCustomMessage({
                    command
                });

                for (let i = 0; i < workersCount; i++) {
                    let worker = createDrawingWorker('./test.js', data.initSharedMemory);
                    // let worker = create_drawing_worker('./test.js');
                    workers.push(worker);
                }
                console.log('workersCount :>> ', workersCount);
                console.log('workers :>> ', workers);
            }
            break;
        case WorkerCommands.Draw:
            {
                let { drawingConfig } = data;
                let drawingResult = draw(drawingConfig);
                // console.log('drawingResult :>> ', drawingResult);

                let ps = drawingConfig.plotScale;
                let plot_scale = new PS(ps.x_offset, ps.y_offset, ps.x_value_range, ps.y_value_range, ps.x_display_range, ps.y_display_range);
                let drawing_mode = Object.values(DrawingModes).indexOf(drawingConfig.drawingMode);

                for (let i = 0; i < 8; i++) {
                    let rustData = new DC(
                        plot_scale,
                        new Float32Array(drawingConfig.roots.flat()),
                        drawingConfig.iterationsCount,
                        new Uint8Array(drawingConfig.regionColors.flat()),
                        i,
                        workersCount
                    );
                    console.log('rustData :>> ', rustData);
                    // rustData.free();
                    // console.log(`Sending drawing config to worker #${i}`);
                    workers[i].postMessage(rustData);
                }

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