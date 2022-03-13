import init, { InitOutput, DrawingConfig, fill_pixels_parallel } from "../pkg/newton_fractal.js";

function actualCallback(e: MessageEvent<{ id: number, drawingConfig: DrawingConfig }>) {
    let msgData = e.data;
    let { id, drawingConfig } = msgData;
    let ptr = (<any>drawingConfig).ptr;
    console.log(`test worker #${id} drawingConfig :>> `, drawingConfig);
    let data = fill_pixels_parallel(ptr);
    // console.log('test worker: data.length :>> ', data.length);
    postMessage({ id, data, drawingConfig });
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