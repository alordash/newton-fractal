import init, { fill_pixels_parallel } from "../pkg/newton_fractal.js";
function actualCallback(e) {
    let drawingConfig = e.data;
    let ptr = drawingConfig.ptr;
    console.log('test worker drawingConfig :>> ', drawingConfig);
    let data = fill_pixels_parallel(ptr);
    console.log('data.length :>> ', data.length);
    postMessage(data);
}
let mod;
onmessage = async function (e) {
    let data = e.data;
    if (typeof (data.init) != 'undefined') {
        let wasmMemory = e.data.wasmMemory;
        mod = await init(undefined, wasmMemory);
        self.onmessage = actualCallback;
    }
};
//# sourceMappingURL=test.js.map