var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import init, { Dimension, Plotter, Polynomial } from '../pkg/newton_fractal.js';
let plotter;
let polynom;
let startPoints = [[0, 0]];
const xParts = 100;
const yParts = 50;
function CanvasClickCallback(me) {
    let x = me.offsetX;
    let y = me.offsetY;
    let p = plotter.canvas_to_plot_to_js(x, y);
    x = p[0];
    y = p[1];
    console.log('polynom :>> ', polynom);
    polynom.add_root(x, y);
    draw();
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        let myCanvas = document.getElementById("main-canvas");
        let myCanvasContext = myCanvas.getContext("2d");
        myCanvas.addEventListener("click", CanvasClickCallback);
        console.log('myCanvas :>> ', myCanvas);
        let dimension = new Dimension(1200, 600, 4, 2, -2, -1);
        plotter = new Plotter(dimension, myCanvas, myCanvasContext);
        plotter.resize_canvas();
        polynom = new Polynomial(startPoints);
        draw();
    });
}
run();
function draw() {
    plotter.plot_points(0.025, 0.025, polynom);
}
//# sourceMappingURL=script.js.map