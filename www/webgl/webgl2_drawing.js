let ctx;
function InitWebgl2Drawing(canvas) {
    ctx = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    console.log('webgl2 ctx :>> ', ctx);
}
export { InitWebgl2Drawing };
//# sourceMappingURL=webgl2_drawing.js.map