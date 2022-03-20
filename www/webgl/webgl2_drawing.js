let ctx;
function InitWebgl2Drawing(canvas) {
    ctx = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    console.log('webgl2 ctx :>> ', ctx);
    createShader(ctx, ctx.VERTEX_SHADER, "./vertex.vert");
}
async function createShader(gl, type, source_url) {
    let shader = gl.createShader(type);
    let source = await fetch(source_url);
    console.log('source :>> ', source);
}
export { InitWebgl2Drawing };
//# sourceMappingURL=webgl2_drawing.js.map