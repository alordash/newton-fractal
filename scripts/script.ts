import init, { draw_on_canvas, MyComplex, draw_grid } from '../pkg/newton_fractal.js';

async function run() {
    await init();

    z = new MyComplex(1.0, 2.0);
    myCanvas = <HTMLCanvasElement>document.getElementById("main-canvas");
    myCanvasContext = myCanvas.getContext("2d");
    
    console.log('myCanvas :>> ', myCanvas);
    draw_on_canvas(myCanvas, 10);
}

run();

let myCanvas: HTMLCanvasElement;
let myCanvasContext: CanvasRenderingContext2D;

let z: MyComplex;

function draw() {
    let power = +powerRange.value;
    powerOutput.value = `Power: ${power}`;
    draw_grid(myCanvas, myCanvasContext, 50, power, 600, 600);
}

let powerOutput = <HTMLInputElement>document.getElementById("powerOutput");
let powerRange = <HTMLInputElement>document.getElementById("powerRange");
powerRange.onchange = powerRange.onmousemove = () => {
    draw();
}
powerRange.addEventListener("change", () => {
    draw();
});