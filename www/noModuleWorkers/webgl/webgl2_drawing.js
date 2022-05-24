import { GLManager } from "./gl_manager.js";
let gl;
let drawing = false;
async function InitWebgl2Drawing(canvas) {
    let ctx = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    gl = await GLManager.create(ctx, "../../webgl/vertex.vert", "../../webgl/fragment.frag");
    gl.initialise();
    return gl;
}
async function drawNewtonFractalGpu(plotScale, iterationsCount, roots, colors) {
    if (drawing) {
        return -1;
    }
    drawing = true;
    let len = roots.length;
    let flatRoots = roots.flat();
    let flatColors = colors.flat().map(v => v / 255.0);
    gl.setIntUniform(len, "roots_count");
    gl.setIntUniform(iterationsCount, "iterations_count");
    gl.setFloatVec2Uniform(flatRoots, "roots");
    gl.setFloatVec4Uniform(flatColors, "colors");
    gl.setPlotScaleUniforms(plotScale);
    let elapsedMs = await gl.drawBlankRectangle();
    drawing = false;
    return elapsedMs;
}
export { InitWebgl2Drawing, drawNewtonFractalGpu, gl };
//# sourceMappingURL=webgl2_drawing.js.map