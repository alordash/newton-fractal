import init, { InitOutput, DrawingConfig } from "../pkg/newton_fractal.js";

function actualCallback(e: MessageEvent<DrawingConfig>) {
    let drawingConfig = e.data;
    console.log('test worker drawingConfig :>> ', drawingConfig);
    postMessage({ drawingConfig });
}

let mod: InitOutput;
onmessage = async function (e: MessageEvent) {
    // console.log(`test worker: setting actual callback`);
    self.onmessage = actualCallback;

    let data = e.data;
    // console.log('test worker data :>> ', data);
    if (typeof (data.init) != 'undefined') {
        let wasmMemory = e.data.wasmMemory;
        mod = await init(undefined, wasmMemory);
    }

}