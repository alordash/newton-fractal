import init, { Dimension, Plotter, Polynomial } from '../pkg/newton_fractal.js';
import { generateColor, regionColors } from './colors.js';
import { calcDimension, fillPixelsJavascript } from './calculation.js';

const startRoots = [[-0.5, -0.25], [-0.75, 0.25], [0, 0.5], [0.75, 0.25], [-0.85, 0.5]];

enum WorkerCommands {
    Init,
    Draw,
    Resize
}

type InitConfig = {
    innerWidth: number,
    innerHeight: number
}

enum DrawingModes {
    CPU_WASM_SIMD = "CPU-wasm-simd",
    CPU_WASM_SCALAR = "CPU-wasm-scalar",
    CPU_JS_SCALAR = "CPU-js-scalar",
}

type DrawingConfig = {
    drawingMode: DrawingModes,
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
    initConfig?: InitConfig,
    drawingConfig?: DrawingConfig,
}

type WorkerResult = {
    command: WorkerCommands,
    drawingResult?: DrawingResult,
    dimension?: { width: number, height: number }
}

let plotter: Plotter;
let polynom: Polynomial;

function addRoot(xMapped: number, yMapped: number) {
    console.log(`Added new root at: (${xMapped}, ${yMapped})`);
    polynom.add_root(xMapped, yMapped);
    if (regionColors.length < polynom.get_roots_count()) {
        regionColors.push(generateColor());
    }
}

function draw(config: DrawingConfig): DrawingResult {
    let { drawingMode, iterationsCount, regionColors } = config;

    let imageData: ImageData;
    let start = new Date();
    switch (drawingMode) {
        case DrawingModes.CPU_JS_SCALAR:
            imageData = fillPixelsJavascript(plotter, polynom, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SCALAR:
            imageData = plotter.fill_pixels_nalgebra(polynom, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SIMD:
            imageData = plotter.fill_pixels_simd_nalgebra(polynom, iterationsCount, regionColors);
            break;

        default:
            break;
    }
    let end = new Date();
    let elapsedMs = end.getTime() - start.getTime();
    return { drawingMode, elapsedMs, imageData };
}

async function InitWasm(initConfig: InitConfig): Promise<Dimension> {
    await init();

    let { innerWidth, innerHeight } = initConfig;
    let dimension = calcDimension(innerWidth, innerHeight);
    plotter = new Plotter(dimension);
    polynom = new Polynomial(startRoots);

    return dimension;
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
                let dimension = await InitWasm(data.initConfig);
                console.log('dimension :>> ', dimension);
                postCustomMessage({
                    command,
                    dimension: { width: dimension.width, height: dimension.height }
                });
            }
            break;
        case WorkerCommands.Resize:
            {
                let { innerWidth, innerHeight } = data.initConfig;
                let dimension = calcDimension(innerWidth, innerHeight);
                plotter.dimension = dimension;
                postCustomMessage({
                    command,
                    dimension: { width: dimension.width, height: dimension.height }
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
    InitConfig,
    DrawingModes,
    DrawingConfig,
    DrawingResult,
    WorkerMessage,
    WorkerResult
}