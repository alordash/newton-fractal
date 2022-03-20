let ctx: WebGL2RenderingContext;

function InitWebgl2Drawing(canvas: HTMLCanvasElement) {
    ctx = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    console.log('webgl2 ctx :>> ', ctx);
}

export {
    InitWebgl2Drawing
}