import { createProgram, createShader, drawBlankRectangle } from "./boilerplater.js";

let ctx: WebGL2RenderingContext;

async function InitWebgl2Drawing(canvas: HTMLCanvasElement) {
    ctx = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    console.log('webgl2 ctx :>> ', ctx);

    ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.clearColor(0, 0, 0, 0);
    ctx.clear(ctx.COLOR_BUFFER_BIT);

    ctx.canvas.width = ctx.canvas.clientWidth;
    ctx.canvas.height = ctx.canvas.clientHeight;

    let vertexShader = await createShader(ctx, ctx.VERTEX_SHADER, "../webgl/vertex.vert");
    let fragmentShader = await createShader(ctx, ctx.FRAGMENT_SHADER, "../webgl/fragment.frag");

    let program = createProgram(ctx, vertexShader, fragmentShader);

    ctx.useProgram(program);
    drawBlankRectangle(ctx, program);
}

export {
    InitWebgl2Drawing
}