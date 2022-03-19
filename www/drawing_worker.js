const WASM_MODULE_SOURCE_PATH = '../pkg/newton_fractal_bg.wasm';
importScripts('../pkg/newton_fractal.js');
importScripts('./fractal_calculation.js');
const { fill_pixels_js, DrawingModes: WasmDrawingModes, get_wasm_memory } = wasm_bindgen;
function actualCallback(e) {
    let message = e.data;
    let { drawingModeId, plotScale, roots, iterationsCount, colors, partOffset, partsCount, bufferPtr } = message;
    switch (drawingModeId) {
        case 0:
            fill_pixels_js(WasmDrawingModes.Simd, plotScale, roots, iterationsCount, colors, bufferPtr, partOffset, partsCount);
            break;
        case 1:
            fill_pixels_js(WasmDrawingModes.Scalar, plotScale, roots, iterationsCount, colors, bufferPtr, partOffset, partsCount);
            break;
        case 2:
            let memory = get_wasm_memory();
            fillPixelsJavascript(memory.buffer, plotScale, roots, iterationsCount, colors, bufferPtr, partOffset, partsCount);
            break;
        default:
            console.log(`Unknown drawing mode, drawing with simds`);
            fill_pixels_js(WasmDrawingModes.Simd, plotScale, roots, iterationsCount, colors, bufferPtr, partOffset, partsCount);
            break;
    }
    postMessage(partOffset, undefined);
}
onmessage = async function (e) {
    let { workerId, sharedMemory } = e.data;
    await wasm_bindgen(WASM_MODULE_SOURCE_PATH, sharedMemory);
    self.onmessage = actualCallback;
    postMessage(workerId, undefined);
};
//# sourceMappingURL=drawing_worker.js.map