var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import init, { Dimension, Plotter, Polynomial, Approximation } from '../pkg/newton_fractal.js';
let approximateButton = document.getElementById("approximateButton");
let plotter;
const xStep = 0.025;
const yStep = 0.025;
let polynom;
let startPoints = [[0, 0]];
let approximation;
const regionsColor = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 0, 255], [255, 0, 255, 255], [0, 255, 255, 255]];
function CreateRootPoint(x, y) {
    polynom.add_root(x, y);
    plotPoints();
}
function AddApproximationPoint(x, y) {
    approximation === null || approximation === void 0 ? void 0 : approximation.free();
    approximation = new Approximation(x, y);
    plotPoints();
}
function CanvasClickCallback(me) {
    let x = me.offsetX;
    let y = me.offsetY;
    let p = plotter.canvas_to_plot_to_js(x, y);
    x = p[0];
    y = p[1];
    if (me.shiftKey) {
        AddApproximationPoint(x, y);
    }
    else {
        CreateRootPoint(x, y);
    }
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        let myCanvas = document.getElementById("main-canvas");
        let myCanvasContext = myCanvas.getContext("2d");
        myCanvas.addEventListener("click", CanvasClickCallback);
        approximation = new Approximation();
        console.log('myCanvas :>> ', myCanvas);
        let dimension = new Dimension(1200, 600, 4, 2, -2, -1);
        plotter = new Plotter(dimension, myCanvas, myCanvasContext);
        plotter.resize_canvas();
        polynom = new Polynomial(startPoints);
        plotPoints();
    });
}
run();
function plotPoints() {
    plotter.plot_points(xStep, yStep, polynom, approximation);
}
approximateButton.addEventListener("click", () => {
    approximation.get_next_point(polynom);
    plotPoints();
});
let reverseColorsButton = document.getElementById("reverseColors");
reverseColorsButton.addEventListener("click", () => {
    plotter.reverse_colors();
});
let voronoiTesselationButton = document.getElementById("voronoiTesselation");
voronoiTesselationButton.addEventListener("click", () => {
    plotter.draw_voronoi_tesselation(polynom, regionsColor);
});
//# sourceMappingURL=script.js.map