import init, { Dimension, Plotter, Polynomial } from '../pkg/newton_fractal.js';

let plotter: Plotter;

let polynom: Polynomial;
let startPoints = [[0, 0]];
const divisionParts = 50;

function CanvasClickCallback(me: MouseEvent) {
    let x = me.offsetX;
    let y = me.offsetY;

    let p = plotter.canvas_to_plot_to_js(x, y);
    x = p[0];
    y = p[1];

    console.log('polynom :>> ', polynom);
    polynom.add_root(x, y);
    draw();
}

async function run() {
    await init();

    let myCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
    let myCanvasContext = myCanvas.getContext("2d");

    myCanvas.addEventListener("click", CanvasClickCallback);

    console.log('myCanvas :>> ', myCanvas);
    let dimension = new Dimension(600, 600, 2, 2, -1, -1);
    plotter = new Plotter(dimension, myCanvas, myCanvasContext);
    plotter.resize_canvas();
    polynom = new Polynomial(startPoints);
    draw();
}

run();

function draw() {
    plotter.plot_points(divisionParts, polynom);
}