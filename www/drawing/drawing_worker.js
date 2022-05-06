import init, { fill_pixels_wasm, DrawingModes as WasmDrawingModes, get_wasm_memory } from '../../pkg/newton_fractal.js';
import { fillPixelsJavascript } from '../math/fractal_calculation.js';
const WASM_MODULE_SOURCE_PATH = '../../pkg/newton_fractal_bg.wasm';
function actualCallback(e) {
    let message = e.data;
    let { drawingModeId, plotScale, roots, iterationsCount, colors, partOffset, partsCount, bufferPtr } = message;
    switch (drawingModeId) {
        case 0:
            let memory = get_wasm_memory();
            fillPixelsJavascript(memory.buffer, plotScale, roots, iterationsCount, colors, bufferPtr, partOffset, partsCount);
            break;
        case 1:
            fill_pixels_wasm(WasmDrawingModes.Scalar, plotScale, roots, iterationsCount, colors, bufferPtr, partOffset, partsCount);
            break;
        case 2:
            fill_pixels_wasm(WasmDrawingModes.Simd, plotScale, roots, iterationsCount, colors, bufferPtr, partOffset, partsCount);
            break;
        default:
            console.log(`Unknown drawing mode, using wasm-scalar`);
            fill_pixels_wasm(WasmDrawingModes.Scalar, plotScale, roots, iterationsCount, colors, bufferPtr, partOffset, partsCount);
            break;
    }
    postMessage(partOffset, undefined);
}
onmessage = async function (e) {
    let { workerId, sharedMemory } = e.data;
    await init(WASM_MODULE_SOURCE_PATH, sharedMemory);
    onmessage = actualCallback;
    postMessage(workerId, undefined);
};
//# sourceMappingURL=drawing_worker.js.map