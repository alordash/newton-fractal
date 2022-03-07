import init, { InitOutput, DrawingConfig, foo, fill_pixels_parallel } from "../pkg/newton_fractal.js";

function actualCallback(e: MessageEvent<{ptr: number}>) {
    let drawingConfig = e.data;
    let ptr = drawingConfig.ptr;
    console.log('test worker drawingConfig :>> ', drawingConfig);
    let data = fill_pixels_parallel(ptr);
    console.log('data.length :>> ', data.length);
    postMessage(data);
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