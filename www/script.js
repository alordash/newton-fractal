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
let myCanvas;
let myCanvasContext;
let plotter;
let polynom;
let startPoint = [[0, 0]];
const divisionParts = 100;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        myCanvas = document.getElementById("main-canvas");
        myCanvasContext = myCanvas.getContext("2d");
        console.log('myCanvas :>> ', myCanvas);
        let dimension = new Dimension(600, 600, 0.5, 0.5);
        plotter = new Plotter(dimension, myCanvas, myCanvasContext);
        plotter.resize_canvas();
        polynom = new Polynomial(startPoint);
        draw();
    });
}
run();
function draw() {
    plotter.plot_points(divisionParts, polynom);
}
//# sourceMappingURL=script.js.map