import init, { Dimension, Plotter, Polynomial, Approximation } from '../pkg/newton_fractal.js';

let approximateButton = <HTMLButtonElement>document.getElementById("approximateButton");

let plotter: Plotter;
const xStep = 0.025;
const yStep = 0.025;

let polynom: Polynomial;
let startPoints = [[0, 0]];

let approximation: Approximation;

const regionsColor = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 0, 255], [255, 0, 255, 255], [0, 255, 255, 255]];

function CreateRootPoint(x: number, y: number) {
    polynom.add_root(x, y);
    plotPoints();
}

function AddApproximationPoint(x: number, y: number) {
    approximation?.free();

    approximation = new Approximation(x, y);

    plotPoints();
}

function CanvasClickCallback(me: MouseEvent) {
    let x = me.offsetX;
    let y = me.offsetY;

    let p = plotter.canvas_to_plot_to_js(x, y);
    x = p[0];
    y = p[1];

    if (me.shiftKey) {
        AddApproximationPoint(x, y);
    } else if (me.ctrlKey) {
        polynom.add_root(x, y);
        drawNewtonsFractal();
    } else {
        CreateRootPoint(x, y);
    }
}

async function run() {
    await init();

    let myCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
    let myCanvasContext = myCanvas.getContext("2d");

    myCanvas.addEventListener("click", CanvasClickCallback);

    approximation = new Approximation();

    console.log('myCanvas :>> ', myCanvas);
    let dimension = new Dimension(1200, 600, 4, 2, -2, -1);
    plotter = new Plotter(dimension, myCanvas, myCanvasContext);
    plotter.resize_canvas();
    polynom = new Polynomial(startPoints);

    plotPoints();
}

run();

function plotPoints() {
    plotter.plot_points(xStep, yStep, polynom, approximation);
}

approximateButton.addEventListener("click", () => {
    approximation.get_next_point(polynom);

    plotPoints();
});

let reverseColorsButton = <HTMLButtonElement>document.getElementById("reverseColors");

reverseColorsButton.addEventListener("click", () => {
    plotter.reverse_colors();
});

let iterationsCountRange = <HTMLInputElement>document.getElementById("iterationsCount");
let iterationsCountDisplay = <HTMLOutputElement>document.getElementById("iterationsCountDisplay");

iterationsCountRange.addEventListener("change", () => {
    iterationsCountDisplay.value = iterationsCountRange.value;
    drawNewtonsFractal();
});

let newtonFractalButton = <HTMLButtonElement>document.getElementById("newtonFractal");

newtonFractalButton.addEventListener("click", drawNewtonsFractal);

function drawNewtonsFractal() {
    let iterationsCount = parseInt(iterationsCountRange.value);
    plotter.draw_newtons_fractal(polynom, iterationsCount, regionsColor);
}