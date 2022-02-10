import init, { Dimension, Plotter, Polynomial } from '../pkg/newton_fractal.js';
import { regionColors } from './colors.js';

let plotter: Plotter;

let polynom: Polynomial;
let startRoots = [[-0.5, -0.25], [-0.75, 0.25], [0, 0.5], [0.75, 0.25]
    , [-0.85, 0.5]
];

enum DrawingModes {
    CPU_SCALAR = "CPU (scalar)",
    CPU_SIMD = "CPU (simd)"
}

let drawingModeSelect = <HTMLSelectElement>document.getElementById("drawingModeSelect");
for (const value of Object.values(DrawingModes)) {
    let option = <HTMLOptionElement>document.createElement("option");
    option.value = value;
    option.innerText = value;
    drawingModeSelect.options.add(option);
}

drawingModeSelect.onchange = () => {
    let value = drawingModeSelect.value;
}

const HOLD_POINT_DST_THRESHOLD = 0.125;
let holdingPointIndex = -1;

function MapPoints(x: number, y: number): { x: number, y: number } {
    let p = plotter.canvas_point_to_plot_to_js(x, y);
    return { x: p[0], y: p[1] };
}

function CanvasClick(me: MouseEvent) {
    if (holdingPointIndex != -1) return;
    let { x, y } = MapPoints(me.offsetX, me.offsetY);

    let id_and_dst = polynom.get_closest_root_id(x, y);
    let id = id_and_dst[0];
    if (me.shiftKey) {
        console.log(`Added new root at: (${x}, ${y})`);
        polynom.add_root(x, y);
    }

    let iterationsCount = parseInt(iterationsCountRange.value);

    console.log(`Drawing technic: ${drawingModeSelect.value}`);
    switch (drawingModeSelect.value) {
        case DrawingModes.CPU_SCALAR:
            plotter.fill_pixels_nalgebra(polynom, iterationsCount, regionColors);
            break;
        case DrawingModes.CPU_SIMD:
            plotter.fill_pixels_simd_nalgebra(polynom, iterationsCount, regionColors);
            break;

        default:
            break;
    }

    console.log("Done drawing.");
    // draw();
}

function CanvasMouseDown(me: MouseEvent) {
    let { x, y } = MapPoints(me.offsetX, me.offsetY);

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

    let { x, y } = MapPoints(me.offsetX, me.offsetY);

    polynom.set_root_by_id(holdingPointIndex, x, y);

    draw()
}

const width = Math.round(window.innerWidth * 0.9 / 4) * 4;
const height = Math.round(window.innerHeight * 0.75);
const k = height / width;
const x_range = 4;
const x_offset = -2;

async function run() {
    await init();

    let myCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
    let myCanvasContext = myCanvas.getContext("2d");

    myCanvas.addEventListener("mousedown", CanvasMouseDown)
    myCanvas.addEventListener("click", CanvasClick);
    myCanvas.addEventListener("mousemove", CanvasMouseMove);

    console.log('myCanvas :>> ', myCanvas);
    let dimension = new Dimension(width, height, x_range, x_range * k, x_offset, x_offset * k);
    plotter = new Plotter(dimension, myCanvas, myCanvasContext);
    plotter.resize_canvas();
    polynom = new Polynomial(startRoots);

    draw();
}

run();

let iterationsCountRange = <HTMLInputElement>document.getElementById("iterationsCount");
let iterationsCountDisplay = <HTMLOutputElement>document.getElementById("iterationsCountDisplay");
iterationsCountDisplay.value = iterationsCountRange.value;

iterationsCountRange.addEventListener("change", () => {
    iterationsCountDisplay.value = iterationsCountRange.value;
    draw();
});

let newtonFractalButton = <HTMLButtonElement>document.getElementById("newtonFractal");

newtonFractalButton.addEventListener("click", draw);

let applyEffectCheckbox = <HTMLInputElement>document.getElementById("applyEffect");

applyEffectCheckbox.addEventListener("change", draw);

function drawNewtonsFractal() {
    let iterationsCount = parseInt(iterationsCountRange.value);
    plotter.draw_newtons_fractal(polynom, iterationsCount, regionColors, applyEffectCheckbox.checked);
}

function displayRoots() {
    plotter.display_roots(polynom);
}

function draw() {
    drawNewtonsFractal();
    displayRoots();
}