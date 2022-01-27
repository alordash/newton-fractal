import init, { Dimension, Plotter, Polynomial } from '../pkg/newton_fractal.js';

let plotter: Plotter;
const xStep = 0.025;
const yStep = 0.025;

let polynom: Polynomial;
let startPoints = [[-0.5, -0.25]];

let regionColors = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 0, 255], [255, 0, 255, 255], [0, 255, 255, 255]];
function dimColors(colors: number[][]) {
    for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < 3; j++) {
            colors[i][j] /= 1.25
        }
    }
}
dimColors(regionColors);

function RemoveRootPoint(x: number, y: number) {
    let id = polynom.get_closest_root_id(x, y);
    polynom.remove_root_by_id(id);
}

function CanvasClickCallback(me: MouseEvent) {
    let x = me.offsetX;
    let y = me.offsetY;

    let p = plotter.canvas_to_plot_to_js(x, y);
    x = p[0];
    y = p[1];

    if (me.shiftKey) {
        RemoveRootPoint(x, y);
    } else {
        polynom.add_root(x, y);
    }

    drawNewtonsFractal();
}

async function run() {
    await init();

    let myCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
    let myCanvasContext = myCanvas.getContext("2d");

    myCanvas.addEventListener("click", CanvasClickCallback);

    console.log('myCanvas :>> ', myCanvas);
    let dimension = new Dimension(1200, 600, 4, 2, -2, -1);
    plotter = new Plotter(dimension, myCanvas, myCanvasContext);
    plotter.resize_canvas();
    polynom = new Polynomial(startPoints);

    // plotPoints();
    drawNewtonsFractal();
}

run();

// function plotPoints() {
//     plotter.plot_points(xStep, yStep, polynom);
// }

let iterationsCountRange = <HTMLInputElement>document.getElementById("iterationsCount");
let iterationsCountDisplay = <HTMLOutputElement>document.getElementById("iterationsCountDisplay");

iterationsCountRange.addEventListener("change", () => {
    iterationsCountDisplay.value = iterationsCountRange.value;
    drawNewtonsFractal();
});

let newtonFractalButton = <HTMLButtonElement>document.getElementById("newtonFractal");

newtonFractalButton.addEventListener("click", drawNewtonsFractal);

let applyEffectCheckbox = <HTMLInputElement>document.getElementById("applyEffect");

applyEffectCheckbox.addEventListener("change", drawNewtonsFractal);

function drawNewtonsFractal() {
    let iterationsCount = parseInt(iterationsCountRange.value);
    plotter.draw_newtons_fractal(polynom, iterationsCount, regionColors, applyEffectCheckbox.checked);
}