import init from "../pkg/newton_fractal.js";
function actualCallback(e) {
    let drawingConfig = e.data;
    console.log('test worker drawingConfig :>> ', drawingConfig);
    postMessage({ drawingConfig });
}
let mod;
onmessage = async function (e) {
    self.onmessage = actualCallback;
    let data = e.data;
    if (typeof (data.init) != 'undefined') {
        let wasmMemory = e.data.wasmMemory;
        mod = await init(undefined, wasmMemory);
    }
};
//# sourceMappingURL=test.js.map