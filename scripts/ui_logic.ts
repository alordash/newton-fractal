import init, { Dimension, Plotter, Polynomial } from '../pkg/newton_fractal.js';
import { generateColor, regionColors } from './colors.js';
import { mapPoints, fillPixelsJavascript } from './calculation.js';

let plotter: Plotter;
let polynom: Polynomial;

const startRoots = [[-0.5, -0.25], [-0.75, 0.25], [0, 0.5], [0.75, 0.25], [-0.85, 0.5]];

enum DrawingModes {
    CPU_WASM_SIMD = "CPU-wasm-simd",
    CPU_WASM_SCALAR = "CPU-wasm-scalar",
    CPU_JS_SCALAR = "CPU-js-scalar",
}

const HOLD_POINT_DST_THRESHOLD = 0.125;
let holdingPointIndex = -1;

let drawingModeSelect = <HTMLSelectElement>document.getElementById("drawingModeSelect");
let iterationsCountRange = <HTMLInputElement>document.getElementById("iterationsCount");
let iterationsCountDisplay = <HTMLOutputElement>document.getElementById("iterationsCountDisplay");
let newtonFractalButton = <HTMLButtonElement>document.getElementById("newtonFractal");
let loggerDiv = document.getElementById("logger");

function addRoot(xMapped: number, yMapped: number) {
    console.log(`Added new root at: (${xMapped}, ${yMapped})`);
    polynom.add_root(xMapped, yMapped);
    if (regionColors.length < polynom.get_roots_count()) {
        regionColors.push(generateColor());
    }
}

function calcDimension(): Dimension {
    const width = Math.round(window.innerWidth * 0.65 / 4) * 4;
    const height = Math.round(window.innerHeight * 0.75);
    const k = height / width;
    const x_range = 4;
    const x_offset = -2;
    return new Dimension(width, height, x_range, x_range * k, x_offset, x_offset * k);
}

function draw(enableLogging: Boolean, drawingMode: DrawingModes = <DrawingModes>drawingModeSelect.value) {
    let iterationsCount = parseInt(iterationsCountRange.value);

    if (enableLogging) {
        console.log(`Drawing technic: ${drawingMode}`);
    }
    let start = new Date();
    switch (drawingMode) {
        case DrawingModes.CPU_JS_SCALAR:
            fillPixelsJavascript(plotter, polynom, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SCALAR:
            plotter.fill_pixels_nalgebra(polynom, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_WASM_SIMD:
            plotter.fill_pixels_simd_nalgebra(polynom, iterationsCount, regionColors);
            break;

        default:
            break;
    }
    let end = new Date();
    let elapsedMs = end.getTime() - start.getTime();
    let fps = Math.round(10000 / elapsedMs) / 10;
    let msg = `Done drawing, took: ${elapsedMs}ms
FPS: ${fps}`;
    if (enableLogging) {
        console.log(msg);
    }
    loggerDiv.innerText = msg;
    plotter.display_roots(polynom);
}

window.addEventListener("resize", () => {
    let dimension = calcDimension();
    plotter.resize_canvas(dimension);
    draw(true);
});

function CanvasClick(me: MouseEvent) {
    if (holdingPointIndex != -1) return;

    if (me.shiftKey) {
        let [x, y] = mapPoints(plotter, me.offsetX, me.offsetY);
        addRoot(x, y);
    }

    draw(true);
}

function CanvasMouseDown(me: MouseEvent) {
    let [x, y] = mapPoints(plotter, me.offsetX, me.offsetY);

    let id_and_dst = polynom.get_closest_root_id(x, y);
    let id = id_and_dst[0];
    let dst = id_and_dst[1];
    if (dst < HOLD_POINT_DST_THRESHOLD) {
        holdingPointIndex = id;
    } else {
        holdingPointIndex = -1;
    }
}

function CanvasMouseMove(me: MouseEvent) {
    if (holdingPointIndex == -1) return;
    if (me.buttons != 1) {
        holdingPointIndex = -1;
        return;
    }

    let [x, y] = mapPoints(plotter, me.offsetX, me.offsetY);
    polynom.set_root_by_id(holdingPointIndex, x, y);

    draw(false)
}

for (const value of Object.values(DrawingModes)) {
    let option = <HTMLOptionElement>document.createElement("option");
    option.value = value;
    option.innerText = value;
    drawingModeSelect.options.add(option);
}

iterationsCountDisplay.value = iterationsCountRange.value;

iterationsCountRange.addEventListener("change", () => {
    iterationsCountDisplay.value = iterationsCountRange.value;
    draw(true);
});

newtonFractalButton.addEventListener("click", () => draw(true));

async function run() {
    await init();

    let myCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
    let myCanvasContext = myCanvas.getContext("2d");

    myCanvas.addEventListener("mousedown", CanvasMouseDown)
    myCanvas.addEventListener("click", CanvasClick);
    myCanvas.addEventListener("mousemove", CanvasMouseMove);

    console.log('myCanvas :>> ', myCanvas);
    let dimension = calcDimension();
    plotter = new Plotter(dimension, myCanvas, myCanvasContext);
    polynom = new Polynomial(startRoots);

    draw(true, DrawingModes.CPU_WASM_SCALAR);
}

run();