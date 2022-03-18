const WASM_MODULE_SOURCE_PATH = '../pkg/newton_fractal_bg.wasm';

importScripts('../pkg/newton_fractal.js');

const { fill_pixels_js, fill_pixels_simd_js } = wasm_bindgen;

function actualCallback(e: MessageEvent<{ drawingModeId: number, plotScale: any, roots: number[][], iterationsCount: number, colors: number[][], partOffset: number, partsCount: number, bufferPtr: number }>) {
    let message = e.data;
    let { drawingModeId, plotScale, roots, iterationsCount, colors, partOffset, partsCount, bufferPtr } = message;
    let data: Uint8ClampedArray;

    switch (drawingModeId) {
        case 0:
            data = fill_pixels_simd_js(plotScale, roots, iterationsCount, colors, partOffset, partsCount, bufferPtr);
            break;
        case 1:
            data = fill_pixels_js(plotScale, roots, iterationsCount, colors, partOffset, partsCount, bufferPtr);
            break;

        default:
            console.log(`Unknown drawing mode, drawing with simds`);
            data = fill_pixels_simd_js(plotScale, roots, iterationsCount, colors, partOffset, partsCount, bufferPtr);
            break;
    }

    postMessage({ workerId: partOffset, doneDrawing: true }, undefined);
}

let mod: InitOutput;
onmessage = async function (e: MessageEvent<{ workerId: number, sharedMemory: WebAssembly.Memory }>) {
    let { workerId, sharedMemory } = e.data;
    await wasm_bindgen(WASM_MODULE_SOURCE_PATH, sharedMemory);

    self.onmessage = actualCallback;
    postMessage({ workerId, doneDrawing: false }, undefined);
}