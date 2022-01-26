import init, { draw_grid, Polynomial } from '../pkg/newton_fractal.js';

let polynom: Polynomial;
let startPoint = [[0, 0], [-0.5, 0], [0.5, 0]];
const divisionParts = 100;

async function run() {
    await init();

    myCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
    myCanvasContext = myCanvas.getContext("2d");
    
    console.log('myCanvas :>> ', myCanvas);
    polynom = new Polynomial(startPoint);
    draw();
}

run();

let myCanvas: HTMLCanvasElement;
let myCanvasContext: CanvasRenderingContext2D;

function draw() {
    let power = +powerRange.value;
    powerOutput.value = `Power: ${power}`;
    draw_grid(myCanvas, myCanvasContext, divisionParts, polynom, 600, 600);
}

let powerOutput = <HTMLInputElement>document.getElementById("powerOutput");
let powerRange = <HTMLInputElement>document.getElementById("powerRange");
powerRange.onchange = powerRange.onmousemove = () => {
    draw();
}
powerRange.addEventListener("change", () => {
    draw();
});