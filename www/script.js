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
let startPoints = [[-0.5, -0.25], [-0.75, 0.25], [0, 0.5], [0.75, 0.25]
];
const HOLD_POINT_DST_THRESHOLD = 0.125;
let holdingPointIndex = -1;
let regionColors = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 0, 255], [255, 0, 255, 255], [0, 255, 255, 255]];
function DimColors(colors) {
    for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < 3; j++) {
            colors[i][j] /= 1.25;
        }
    }
}
DimColors(regionColors);
function MapPoints(x, y) {
    let p = plotter.canvas_to_plot_to_js(x, y);
    return { x: p[0], y: p[1] };
}
function CanvasClick(me) {
    let iterationsCount = parseInt(iterationsCountRange.value);
    if (me.shiftKey) {
        console.log("SIMD");
        plotter.fill_pixels_simd_nalgebra(polynom, iterationsCount, regionColors);
    }
    else {
        console.log("SCALAR");
        plotter.fill_pixels_nalgebra(polynom, iterationsCount, regionColors);
    }
}
function CanvasMouseDown(me) {
    let { x, y } = MapPoints(me.offsetX, me.offsetY);
    let id_and_dst = polynom.get_closest_root_id(x, y);
    let id = id_and_dst[0];
    let dst = id_and_dst[1];
    if (dst < HOLD_POINT_DST_THRESHOLD) {
        holdingPointIndex = id;
    }
    else {
        holdingPointIndex = -1;
    }
}
function CanvasMouseMove(me) {
    if (holdingPointIndex == -1)
        return;
    if (me.buttons != 1) {
        holdingPointIndex = -1;
        return;
    }
    let { x, y } = MapPoints(me.offsetX, me.offsetY);
    polynom.set_root_by_id(holdingPointIndex, x, y);
    draw();
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        let myCanvas = document.getElementById("main-canvas");
        let myCanvasContext = myCanvas.getContext("2d");
        myCanvas.addEventListener("click", CanvasClick);
        console.log('myCanvas :>> ', myCanvas);
        let dimension = new Dimension(1919, 1001, 4, 2, -2, -1);
        plotter = new Plotter(dimension, myCanvas, myCanvasContext);
        plotter.resize_canvas();
        polynom = new Polynomial(startPoints);
        draw();
    });
}
run();
let iterationsCountRange = document.getElementById("iterationsCount");
let iterationsCountDisplay = document.getElementById("iterationsCountDisplay");
iterationsCountRange.addEventListener("change", () => {
    iterationsCountDisplay.value = iterationsCountRange.value;
    draw();
});
let newtonFractalButton = document.getElementById("newtonFractal");
newtonFractalButton.addEventListener("click", draw);
let applyEffectCheckbox = document.getElementById("applyEffect");
applyEffectCheckbox.addEventListener("change", draw);
function drawNewtonsFractal() {
    let iterationsCount = parseInt(iterationsCountRange.value);
    plotter.draw_newtons_fractal(polynom, iterationsCount, regionColors, applyEffectCheckbox.checked);
}
function displayRoots() {
    plotter.display_roots(polynom);
}
function draw() {
    drawNewtonsFractal();
    displayRoots();
}
//# sourceMappingURL=script.js.map