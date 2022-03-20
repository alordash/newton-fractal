import { GLManager } from "./gl_manager.js";
let gl;
async function InitWebgl2Drawing(canvas) {
    let ctx = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    gl = await GLManager.create(ctx, "../webgl/vertex.vert", "../webgl/fragment.frag");
    gl.initialise();
    return gl;
}
function drawNewtonFractal(plotScale, roots, colors) {
    let len = roots.length;
    let flatRoots = roots.flat();
    let flatColors = colors.flat().map(v => v / 255.0);
    gl.setIntUniform(len, "roots_count");
    gl.setFloatVec2Uniform(flatRoots, "roots");
    gl.setFloatVec4Uniform(flatColors, "colors");
    gl.setPlotScaleUniforms(plotScale);
    gl.drawBlankRectangle();
}
export { InitWebgl2Drawing, drawNewtonFractal, gl };
//# sourceMappingURL=webgl2_drawing.js.map