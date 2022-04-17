import { changePreset, regionColors, roots } from './visuals/fractal_presets.js';
import { generateColor } from './visuals/colors.js';
import { PlotScale, addRoot, getClosestRoot } from './math/geometry.js';
import { DrawingModes, runDrawingWorkers } from './drawing/drawing_manager.js';
import { drawNewtonFractalGpu, InitWebgl2Drawing, gl } from './webgl/webgl2_drawing.js';
const CPU_MAX_ITERATIONS_COUNT = 25;
const GPU_MAX_ITERATIONS_COUNT = 250;
const ROOT_POINT_SIZE = 4.0;
const CLICK_POINT_DISTANCE = 10;
let SCALE = 1;
const RESIZE_FACTOR = 0.011;
let plotScale = PlotScale.calculatePlotScale(window.innerWidth, window.innerHeight);
let holdingPointIndex = -1;
const TOTAL_FPS_RESET_THRESHOLD = 1000;
let totalFps = 0;
let fpsMeasures = -2;
function getIterationsCount() {
    return parseInt(iterationsCountRange.value);
}
function resetFps() {
    totalFps = 0;
    fpsMeasures = -2;
}
function calculateFps(elapsedMs) {
    fpsMeasures += 1;
    if (fpsMeasures <= 0) {
        return;
    }
    let fps = 1000 / elapsedMs;
    totalFps += fps;
    if (totalFps > TOTAL_FPS_RESET_THRESHOLD) {
        totalFps = fps;
        fpsMeasures = 1;
    }
    let precisionPower = 10;
    if (fps < 1) {
        precisionPower = 100;
    }
    fps = Math.round(fps * precisionPower) / precisionPower;
}
function updateInfoPanel(drawingMode, elapsedMs, approximate = false) {
    loggerDiv.innerHTML = `Canvas size: ${cpuCanvas.width}x${cpuCanvas.height}</br>
Roots count: ${roots.length}</br>
Drawing technic: ${drawingMode}</br>
Took: ${elapsedMs}ms<br>
<b>Average FPS: ${approximate ? '~' : ''}${fpsMeasures <= 0 ? 0 : Math.round(totalFps * 10 / fpsMeasures) / 10}</b>`;
}
let waitingForDrawing = false;
async function draw(drawingMode, threadsCount) {
    let iterationsCount = getIterationsCount();
    let fpsIsApproximate = false;
    if (drawingMode == undefined) {
        drawingMode = drawingModeSelect.value;
    }
    if (threadsCount == undefined) {
        threadsCount = parseInt(threadsCountRange.value);
    }
    let elapsedMs;
    if (drawingMode == DrawingModes.GpuGlslScalar) {
        elapsedMs = await drawNewtonFractalGpu(plotScale, iterationsCount, roots, regionColors);
        if (elapsedMs == -1) {
            return;
        }
        fpsIsApproximate = true;
    }
    else {
        let result = runDrawingWorkers(drawingMode, plotScale, roots, iterationsCount, regionColors, threadsCount);
        if (result == false) {
            waitingForDrawing = true;
            return;
        }
        waitingForDrawing = false;
        let drawingResult = await result;
        let data = new Uint8ClampedArray(drawingResult.data);
        let { plotScale: { x_display_range: width, y_display_range: height } } = drawingResult;
        elapsedMs = drawingResult.elapsedMs;
        let imageData = new ImageData(data, width, height);
        cpuCanvasContext.putImageData(imageData, 0, 0);
    }
    calculateFps(elapsedMs);
    elapsedMs = Math.round(elapsedMs * 100) / 100;
    updateInfoPanel(drawingMode, elapsedMs, fpsIsApproximate);
    plotRoots(plotScale, roots);
    if (waitingForDrawing) {
        draw();
    }
}
function plotPoint(x, y, size, plotScale) {
    let [canvasX, canvasY] = transformPointToCanvasScale(x, y, plotScale);
    rootsCanvasContext.moveTo(canvasX, canvasY);
    rootsCanvasContext.beginPath();
    rootsCanvasContext.arc(canvasX, canvasY, size, 0, Math.PI * 2);
    rootsCanvasContext.fillStyle = "wheat";
    rootsCanvasContext.fill();
    rootsCanvasContext.stroke();
    rootsCanvasContext.closePath();
}
function plotRoots(plotScale, roots) {
    rootsCanvasContext.clearRect(0, 0, rootsCanvas.width, rootsCanvas.height);
    for (let [x, y] of roots) {
        plotPoint(x, y, ROOT_POINT_SIZE, plotScale);
    }
}
function resizeCanvas(width, height) {
    rootsCanvas.width =
        gpuCanvas.width =
            cpuCanvas.width = width;
    rootsCanvas.height =
        gpuCanvas.height =
            cpuCanvas.height = height;
}
async function CanvasClick(me) {
    if (holdingPointIndex != -1)
        return;
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    let iterationsCount = getIterationsCount();
    if (me.shiftKey) {
        resetFps();
        addRoot(x, y);
    }
    else if (me.ctrlKey) {
        let { id, dst } = getClosestRoot(x, y, plotScale);
        resetFps();
        roots.splice(id, 1);
    }
    else if (me.altKey) {
        let id = wasm_bindgen.get_root_id_wasm(x, y, roots, iterationsCount);
        regionColors[id] = generateColor();
    }
    draw();
}
let lastMousePos = { x: 0, y: 0 };
function CanvasMouseDown(me) {
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    lastMousePos = { x: me.offsetX, y: me.offsetY };
    let { id, dst } = getClosestRoot(x, y, plotScale);
    if (dst < CLICK_POINT_DISTANCE && !me.shiftKey && !me.ctrlKey) {
        holdingPointIndex = id;
    }
    else {
        holdingPointIndex = -1;
    }
}
function CanvasMouseMove(me) {
    if (holdingPointIndex == -1) {
        let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
        let { id, dst } = getClosestRoot(x, y, plotScale);
        if (dst < CLICK_POINT_DISTANCE) {
            document.body.style.cursor = "all-scroll";
        }
        else {
            document.body.style.cursor = "auto";
        }
        if (me.buttons == 1) {
            let newX = me.offsetX;
            let newY = me.offsetY;
            let dx = lastMousePos.x - newX;
            let dy = lastMousePos.y - newY;
            plotScale.x_offset += plotScale.x_value_range * dx / plotScale.x_display_range;
            plotScale.y_offset += plotScale.y_value_range * dy / plotScale.y_display_range;
            lastMousePos = { x: me.offsetX, y: me.offsetY };
            draw();
        }
        return;
    }
    if (me.buttons != 1) {
        holdingPointIndex = -1;
        return;
    }
    let [x, y] = transformPointToPlotScale(me.offsetX, me.offsetY, plotScale);
    roots[holdingPointIndex] = [x, y];
    draw();
}
function CanvasWheelEvent(we) {
    let [x, y] = transformPointToPlotScale(we.offsetX, we.offsetY, plotScale);
    let d = we.deltaY * RESIZE_FACTOR;
    if (d < 0) {
        d = -1 / d;
    }
    plotScale.x_offset -= (d - 1) * (x - plotScale.x_offset);
    plotScale.y_offset -= (d - 1) * (y - plotScale.y_offset);
    plotScale.x_value_range *= d;
    plotScale.y_value_range *= d;
    draw();
}
async function WindowResize() {
    let { innerWidth, innerHeight } = window;
    plotScale = PlotScale.calculatePlotScale(innerWidth, innerHeight, plotScale.x_offset, plotScale.x_value_range, plotScale.y_offset);
    resizeCanvas(plotScale.x_display_range, plotScale.y_display_range);
    gl.resize();
    resetFps();
    draw();
}
let cpuCanvas = document.getElementById("cpuCanvas");
let cpuCanvasContext = cpuCanvas.getContext("2d");
let rootsCanvas = document.getElementById("rootsCanvas");
let rootsCanvasContext = rootsCanvas.getContext("2d");
let gpuCanvas = document.getElementById("gpuCanvas");
let drawingModeSelect = document.getElementById("drawingModeSelect");
let iterationsCountRange = document.getElementById("iterationsCount");
let iterationsCountDisplay = document.getElementById("iterationsCountDisplay");
let threadsCountRange = document.getElementById("threadsCount");
let threadsCountDisplay = document.getElementById("threadsCountDisplay");
let loggerDiv = document.getElementById("logger");
let changePresetButton = document.getElementById("changePresetButton");
for (const value of Object.values(DrawingModes)) {
    let option = document.createElement("option");
    option.value = value.toString();
    option.innerText = value.toString();
    drawingModeSelect.options.add(option);
}
drawingModeSelect.addEventListener('change', () => {
    let drawingMode = drawingModeSelect.value;
    if (drawingMode == DrawingModes.GpuGlslScalar) {
        iterationsCountRange.max = GPU_MAX_ITERATIONS_COUNT.toString();
        cpuCanvas.style.display = 'none';
        gpuCanvas.style.display = 'block';
        threadsCountRange.disabled = true;
    }
    else {
        let iterationsCount = getIterationsCount();
        if (iterationsCount > CPU_MAX_ITERATIONS_COUNT) {
            iterationsCountDisplay.value = iterationsCountRange.value = CPU_MAX_ITERATIONS_COUNT.toString();
        }
        iterationsCountRange.max = CPU_MAX_ITERATIONS_COUNT.toString();
        cpuCanvas.style.display = 'block';
        gpuCanvas.style.display = 'none';
        threadsCountRange.disabled = false;
    }
    resetFps();
    draw();
});
drawingModeSelect.value = DrawingModes.CpuWasmScalar;
iterationsCountDisplay.value = iterationsCountRange.value;
iterationsCountRange.addEventListener("change", () => {
    iterationsCountDisplay.value = iterationsCountRange.value;
    resetFps();
    draw();
});
threadsCountRange.max = navigator.hardwareConcurrency.toString();
threadsCountDisplay.value = threadsCountRange.value;
threadsCountRange.addEventListener("change", () => {
    threadsCountDisplay.value = threadsCountRange.value;
    resetFps();
    draw();
});
const changePresetButtonCallback = () => {
    changePreset();
    resetFps();
    draw();
};
changePresetButton.addEventListener("click", changePresetButtonCallback);
window.addEventListener("keydown", e => {
    let c = e.key.toLocaleLowerCase();
    if (c == 'escape') {
        plotScale = PlotScale.calculatePlotScale(window.innerWidth, window.innerHeight);
        draw();
        return;
    }
    if (e.ctrlKey || e.shiftKey) {
        return;
    }
    if (c == 'c' || c == 'с') {
        changePresetButtonCallback();
    }
});
async function run() {
    InitWebgl2Drawing(gpuCanvas);
    rootsCanvas.addEventListener("click", CanvasClick);
    rootsCanvas.addEventListener("mousedown", CanvasMouseDown);
    rootsCanvas.addEventListener("mousemove", CanvasMouseMove);
    rootsCanvas.addEventListener("wheel", CanvasWheelEvent);
    window.addEventListener("resize", WindowResize);
    iterationsCountRange.max = CPU_MAX_ITERATIONS_COUNT.toString();
    let iterationsCount = getIterationsCount();
    let firstDraw = runDrawingWorkers(DrawingModes.CpuWasmScalar, plotScale, roots, iterationsCount, regionColors);
    firstDraw.then(async () => {
        WindowResize();
        await InitWebgl2Drawing(gpuCanvas);
        await drawNewtonFractalGpu(plotScale, getIterationsCount(), roots, regionColors);
    });
}
run();
//# sourceMappingURL=ui_logic.js.map