import { GLManager } from "./gl_manager.js";

let gl: GLManager;

async function InitWebgl2Drawing(canvas: HTMLCanvasElement) {
    let ctx = canvas.getContext("webgl2", { powerPreference: "high-performance" });

    gl = await GLManager.create(ctx, "../webgl/vertex.vert", "../webgl/fragment.frag");
    gl.initialise();

    return gl;
}

function drawNewtonFractal(plotScale: PlotScale, roots: number[][], colors: number[][]) {
    let len = roots.length;

    let flatRoots = roots.flat();
    let flatColors = colors.flat().map(v => v / 255.0);

    gl.setIntUniform(len, "roots_count");
    gl.setFloatVec2Uniform(flatRoots, "roots");
    gl.setFloatVec4Uniform(flatColors, "colors");

    gl.setPlotScaleUniforms(plotScale);

    gl.drawBlankRectangle();
}

export {
    InitWebgl2Drawing,
    drawNewtonFractal,
    gl
}