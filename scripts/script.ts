import init, { Dimension, Plotter, Polynomial } from '../pkg/newton_fractal.js';

let myCanvas: HTMLCanvasElement;
let myCanvasContext: CanvasRenderingContext2D;

let plotter: Plotter;

let polynom: Polynomial;
let startPoint = [[0, 0]];
const divisionParts = 100;

async function run() {
    await init();

    myCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
    myCanvasContext = myCanvas.getContext("2d");

    console.log('myCanvas :>> ', myCanvas);
    let dimension = new Dimension(600, 600, 0.5, 0.5);
    plotter = new Plotter(dimension, myCanvas, myCanvasContext);
    plotter.resize_canvas();
    polynom = new Polynomial(startPoint);
    draw();
}

run();

function draw() {
    plotter.plot_points(divisionParts, polynom);
}

// myCanvas.addEventListener("click", (me) => {

// });