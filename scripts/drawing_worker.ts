import init, { DrawingConfig as DC, fill_pixels_js, fill_pixels_simd_js, InitOutput, PlotScale as PS, create_image_buffer, free_image_buffer } from '../pkg/newton_fractal.js';
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

const workersCount = 4//navigator.hardwareConcurrency;
let workers: Worker[] = [];
let rustData: DC[] = [];
let initialized = false;
let doneCount = 0;

let mod: InitOutput;

function testWorkerCallback(e: MessageEvent<{ id: number, data: Uint8ClampedArray }>) {
    let { id, data } = e.data;
    let drawingConfig = rustData[id];
    console.log('Message from test worker :>> ', e.data);
    console.log(`del rustData[${id}] :>> `, rustData[id]);

    doneCount++;
    console.log('doneCount :>> ', doneCount);
    if (doneCount == workersCount) {
        let { plot_scale, buffer_ptr } = drawingConfig;
        let { xDisplayRange: width, yDisplayRange: height } = plot_scale;
        console.log('buffer_ptr :>> ', buffer_ptr, "removing it's data with size: ", width * height);
        free_image_buffer(width, height, buffer_ptr);
    }
    // rustData[id].free();
    // console.log(`del rustData[${id}] :>> `, rustData[id]);
    // console.log(`del rustData[${id}].plot_scale :>> `, rustData[id].plot_scale);
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

                if (initialized) {
                    doneCount = 0;
                    let ps = drawingConfig.plotScale;
                    let drawing_mode = Object.values(DrawingModes).indexOf(drawingConfig.drawingMode);
                    let plot_scale = new PS(ps.x_offset, ps.y_offset, ps.x_value_range, ps.y_value_range, ps.x_display_range, ps.y_display_range);
                    let image_data_buffer = create_image_buffer(ps.x_display_range, ps.y_display_range);
                    // image_data_buffer = undefined;
                    if (image_data_buffer == undefined) {
                        console.error("Error creating image buffer");
                    }
                    console.log('image_data_buffer :>> ', image_data_buffer);

                    for (let i = 0; i < workersCount; i++) {
                        rustData[i] = new DC(
                            plot_scale,
                            new Float32Array(drawingConfig.roots.flat()),
                            drawingConfig.iterationsCount,
                            new Uint8Array(drawingConfig.regionColors.flat()),
                            i,
                            workersCount,
                            image_data_buffer
                        );
                        console.log(`rustData[${i}] :>> `, rustData[i]);
                        // rustData[i].plot_scale.free();
                        // rustData.free();
                        // console.log(`Sending drawing config to worker #${i}`);
                    }
                    for (let i = 0; i < workersCount; i++) {
                        workers[i].postMessage({ id: i, drawingConfig: rustData[i] });
                    }
                    plot_scale.free();
                } else {
                    initialized = true;
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