const WASM_MODULE_SOURCE_PATH = '../pkg/newton_fractal_bg.wasm';

importScripts('../pkg/newton_fractal.js');

const { fill_pixels_js } = wasm_bindgen;

function actualCallback(e: MessageEvent<{ id: number, plotScale: any, roots: number[][], iterationsCount: number, colors: number[][], partOffset: number, partsCount: number, bufferPtr: number }>) {
    let message = e.data;
    let { plotScale, roots, iterationsCount, colors, partOffset, partsCount, bufferPtr } = message;
    let data = fill_pixels_js(plotScale, roots, iterationsCount, colors, partOffset, partsCount, bufferPtr);
    console.log(`test worker #${partOffset}: data.length :>> `, data.length);
    postMessage({ workerId: partOffset, doneDrawing: true }, undefined);
}

let mod: InitOutput;
onmessage = async function (e: MessageEvent<{ workerId: number, sharedMemory: WebAssembly.Memory }>) {
    let { workerId, sharedMemory } = e.data;
    await wasm_bindgen(WASM_MODULE_SOURCE_PATH, sharedMemory);

    self.onmessage = actualCallback;
    postMessage({ workerId, doneDrawing: false }, undefined);
}