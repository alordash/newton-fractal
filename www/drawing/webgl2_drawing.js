let ctx;
async function InitWebgl2Drawing(canvas) {
    ctx = canvas.getContext("webgl2", { powerPreference: "high-performance" });
    console.log('webgl2 ctx :>> ', ctx);
    ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.clearColor(0, 0, 0, 0);
    ctx.clear(ctx.COLOR_BUFFER_BIT);
    let vertexShader = await createShader(ctx, ctx.VERTEX_SHADER, "../webgl/vertex.vert");
    let fragmentShader = await createShader(ctx, ctx.FRAGMENT_SHADER, "../webgl/fragment.frag");
    let program = createProgram(ctx, vertexShader, fragmentShader);
    initProgram(ctx, program);
}
async function createShader(gl, type, source_url) {
    let shader = gl.createShader(type);
    let response = await fetch(source_url);
    let source = await response.text();
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log(`Error compiling shader: `, gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return;
}
function createProgram(gl, vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(`Error linking program: `, gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
}
function initProgram(gl, program) {
    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var positions = [
        0, 0,
        0, 0.5,
        0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}
export { InitWebgl2Drawing };
//# sourceMappingURL=webgl2_drawing.js.map