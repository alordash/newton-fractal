import init, { InitOutput, DrawingConfig, fill_pixels_parallel } from "../pkg/newton_fractal.js";

function actualCallback(e: MessageEvent<{ id: number, drawingConfig: { dc: DrawingConfig, simd: boolean } }>) {
    let msgData = e.data;
    let { id, drawingConfig } = msgData;
    let { simd } = drawingConfig;
    let ptr = (<any>drawingConfig.dc).ptr;
    let data = fill_pixels_parallel(ptr, simd);
    // console.log(`test worker #${id}: data.length :>> `, data.length);
    postMessage({ id, data, drawingConfig: drawingConfig.dc });
}

let mod: InitOutput;
onmessage = async function (e: MessageEvent) {

    let data = e.data;
    if (typeof (data.init) != 'undefined') {
        let wasmMemory = e.data.wasmMemory;
        mod = await init(undefined, wasmMemory);
        self.onmessage = actualCallback;
    }

}