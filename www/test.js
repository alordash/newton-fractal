import init, { fill_pixels_parallel } from "../pkg/newton_fractal.js";
function actualCallback(e) {
    let msgData = e.data;
    let { id, drawingConfig } = msgData;
    let ptr = drawingConfig.dc.ptr;
    let data = fill_pixels_parallel(ptr);
    postMessage({ id, data, drawingConfig: drawingConfig.dc });
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