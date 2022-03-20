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
function drawBlankRectangle(gl, program) {
    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var positions = [
        -1, 1,
        -1, -1,
        1, -1,
        -1, 1,
        1, 1,
        1, -1
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
export { createShader, createProgram, drawBlankRectangle };
//# sourceMappingURL=boilerplater.js.map