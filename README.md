# Newton's fractal

Runtime [Newton's fractal](https://en.wikipedia.org/wiki/Newton_fractal) renderer.

### [>>Click<<](https://alordash.github.io/newton-fractal/www/index.html) to open in your browser

Inspired by [3blue1brown](https://www.3blue1brown.com/)'s [video about Newton's fractal](https://youtu.be/-RdOwhmqP5s).

## Drawing techniques

1. Javascript  
   _source files: [fractal_calculation.ts](https://github.com/alordash/newton-fractal/blob/main/scripts/math/fractal_calculation.ts) and [geometry.ts](https://github.com/alordash/newton-fractal/blob/main/scripts/math/geometry.ts)_
2. Rust-WASM: scalar  
   _source files: [fractal_calculation.rs](https://github.com/alordash/newton-fractal/blob/main/src/fractal_calculation.rs) and [geometry.rs](https://github.com/alordash/newton-fractal/blob/main/src/geometry.rs)_
3. Rust-WASM: [SIMD](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data) commands  
   _source files: [fractal_calculation.rs](https://github.com/alordash/newton-fractal/blob/main/src/fractal_calculation.rs) and [simd_math.rs](https://github.com/alordash/newton-fractal/blob/main/src/simd_math.rs) (includes comments)_  

4. GPU glsl  
   _shaders: [vertex.vert](https://github.com/alordash/newton-fractal/blob/main/webgl/vertex.vert) and [fragment.frag](https://github.com/alordash/newton-fractal/blob/main/webgl/fragment.frag)_  
   _source files: [webgl2_drawing.ts](https://github.com/alordash/newton-fractal/blob/main/scripts/webgl/webgl2_drawing.ts) and [gl_manager.ts](https://github.com/alordash/newton-fractal/blob/main/scripts/webgl/gl_manager.ts)_

5. Multithreading for 1-3 techniques  
   _source files: [drawing_manager.ts](https://github.com/alordash/newton-fractal/blob/main/scripts/drawing/drawing_manager.ts) and [drawing_worker.ts](https://github.com/alordash/newton-fractal/blob/main/scripts/drawing/drawing_worker.ts)_
