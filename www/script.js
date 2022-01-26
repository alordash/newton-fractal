var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import init, { draw_grid, Polynomial } from '../pkg/newton_fractal.js';
let polynom;
let startPoint = [[0, 0], [-0.5, 0], [0.5, 0]];
const divisionParts = 100;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        myCanvas = document.getElementById("main-canvas");
        myCanvasContext = myCanvas.getContext("2d");
        console.log('myCanvas :>> ', myCanvas);
        polynom = new Polynomial(startPoint);
        draw();
    });
}
run();
let myCanvas;
let myCanvasContext;
function draw() {
    let power = +powerRange.value;
    powerOutput.value = `Power: ${power}`;
    draw_grid(myCanvas, myCanvasContext, divisionParts, polynom, 600, 600);
}
let powerOutput = document.getElementById("powerOutput");
let powerRange = document.getElementById("powerRange");
powerRange.onchange = powerRange.onmousemove = () => {
    draw();
};
powerRange.addEventListener("change", () => {
    draw();
});
//# sourceMappingURL=script.js.map