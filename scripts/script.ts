import init, { Dimension, Plotter, Polynomial } from '../pkg/newton_fractal.js';
// import { newton_method_test, simd_newton_method_test } from '../pkg/newton_fractal.js';

let plotter: Plotter;

let polynom: Polynomial;
let startRoots = [[-0.5, -0.25], [-0.75, 0.25], [0, 0.5], [0.75, 0.25]
    , [-0.85, 0.5]
];

const HOLD_POINT_DST_THRESHOLD = 0.125;
let holdingPointIndex = -1;

let regionColors = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 0, 255], [255, 0, 255, 255], [0, 255, 255, 255]];
function DimColors(colors: number[][]) {
    for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < 3; j++) {
            colors[i][j] /= 1.25
        }
    }
}
DimColors(regionColors);

function MapPoints(x: number, y: number): { x: number, y: number } {
    let p = plotter.canvas_point_to_plot_to_js(x, y);
    return { x: p[0], y: p[1] };
}

function CanvasClick(me: MouseEvent) {
    // if (holdingPointIndex != -1) return;
    // let { x, y } = MapPoints(me.offsetX, me.offsetY);

    // let id_and_dst = polynom.get_closest_root_id(x, y);
    // let id = id_and_dst[0];
    // // if (me.shiftKey) {
    // //     polynom.add_root(x, y);
    // // }

    let iterationsCount = parseInt(iterationsCountRange.value);

    if (me.shiftKey) {
        console.log("SIMD");
        // simd_newton_method_test(polynom);
        plotter.fill_pixels_simd_nalgebra(polynom, iterationsCount, regionColors);
    } else {
        console.log("SCALAR");
        // newton_method_test(polynom);
        plotter.fill_pixels_nalgebra(polynom, iterationsCount, regionColors);
    }

    console.log("END");
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

const width = 1920;
const height = 1080;
const k = height / width;
const x_range = 4;
const x_offset = -2;

async function run() {
    await init();

    let myCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
    let myCanvasContext = myCanvas.getContext("2d");

    // myCanvas.addEventListener("mousedown", CanvasMouseDown)
    myCanvas.addEventListener("click", CanvasClick);
    // myCanvas.addEventListener("mousemove", CanvasMouseMove);

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