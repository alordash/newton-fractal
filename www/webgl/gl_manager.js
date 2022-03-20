class GLManager {
    Initialise() {
        let ctx = this.ctx;
        let { width, height } = ctx.canvas;
        ctx.viewport(0, 0, width, height);
        ctx.clearColor(0, 0, 0, 0);
        ctx.clear(ctx.COLOR_BUFFER_BIT);
    }
    drawBlankRectangle() {
        let { ctx } = this;
        let positionAttributeLocation = ctx.getAttribLocation(this.program, "a_position");
        let positionBuffer = ctx.createBuffer();
        ctx.bindBuffer(ctx.ARRAY_BUFFER, positionBuffer);
        var positions = [
            -1, 1,
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
            1, -1
        ];
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(positions), ctx.STATIC_DRAW);
        var vao = ctx.createVertexArray();
        ctx.bindVertexArray(vao);
        ctx.enableVertexAttribArray(positionAttributeLocation);
        ctx.vertexAttribPointer(positionAttributeLocation, 2, ctx.FLOAT, false, 0, 0);
        ctx.bindVertexArray(vao);
        ctx.drawArrays(ctx.TRIANGLES, 0, 6);
    }
    setIntUniform(x, uniform_name) {
        let { ctx } = this;
        let location = ctx.getUniformLocation(this.program, uniform_name);
        ctx.uniform1i(location, x);
    }
    setFloatUniform(x, uniform_name) {
        let { ctx } = this;
        let location = ctx.getUniformLocation(this.program, uniform_name);
        ctx.uniform1f(location, x);
    }
    setFloatVec2Uniform(x, uniform_name) {
        let { ctx } = this;
        let location = ctx.getUniformLocation(this.program, uniform_name);
        ctx.uniform2fv(location, x);
    }
    setFloatVec4Uniform(x, uniform_name) {
        let { ctx } = this;
        let location = ctx.getUniformLocation(this.program, uniform_name);
        ctx.uniform4fv(location, x);
    }
    setPlotScaleUniforms(plotScale) {
        let { x_offset, y_offset, x_value_range, y_value_range, x_display_range, y_display_range } = plotScale;
        this.setFloatUniform(x_offset, "x_offset");
        this.setFloatUniform(y_offset, "y_offset");
        this.setFloatUniform(x_value_range, "x_value_range");
        this.setFloatUniform(y_value_range, "y_value_range");
        this.setFloatUniform(x_display_range, "x_display_range");
        this.setFloatUniform(y_display_range, "y_display_range");
    }
    static async Create(ctx, vertShaderSourceUrl, fragShaderSourceUrl) {
        let gl = new GLManager();
        gl.ctx = ctx;
        gl.vertShader = await GLManager.createShader(ctx, ctx.VERTEX_SHADER, vertShaderSourceUrl);
        gl.fragShader = await GLManager.createShader(ctx, ctx.FRAGMENT_SHADER, fragShaderSourceUrl);
        gl.program = GLManager.createProgram(ctx, gl.vertShader, gl.fragShader);
        gl.ctx.useProgram(gl.program);
        return gl;
    }
    static async createShader(ctx, type, source_url) {
        let shader = ctx.createShader(type);
        let response = await fetch(source_url);
        let source = await response.text();
        ctx.shaderSource(shader, source);
        ctx.compileShader(shader);
        let success = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        console.log(`Error compiling shader: `, ctx.getShaderInfoLog(shader));
        ctx.deleteShader(shader);
        return;
    }
    static createProgram(ctx, vertexShader, fragmentShader) {
        let program = ctx.createProgram();
        ctx.attachShader(program, vertexShader);
        ctx.attachShader(program, fragmentShader);
        ctx.linkProgram(program);
        let success = ctx.getProgramParameter(program, ctx.LINK_STATUS);
        if (success) {
            return program;
        }
        console.log(`Error linking program: `, ctx.getProgramInfoLog(program));
        ctx.deleteProgram(program);
        return;
    }
}
export { GLManager };
//# sourceMappingURL=gl_manager.js.map