use super::polynomial::Polynomial;
use num_complex::{Complex, Complex32};
use wasm_bindgen::{prelude::*, Clamped};
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement, ImageData};

use std::arch::wasm32::*;
use std::mem::transmute;

use nalgebra::{DMatrix, RawStorage};

use super::logger::*;

const SEARCH_TRESHOLD: f32 = 0.01;

#[wasm_bindgen]
#[derive(Clone, Copy)]
#[repr(C)]
pub struct Dimension {
    pub width: f32,
    pub height: f32,
    pub x_range: f32,
    pub y_range: f32,
    pub x_offset: f32,
    pub y_offset: f32,
}

#[wasm_bindgen]
impl Dimension {
    #[wasm_bindgen(constructor)]
    pub fn new(
        width: f32,
        height: f32,
        x_range: f32,
        y_range: f32,
        x_offset: f32,
        y_offset: f32,
    ) -> Dimension {
        Dimension {
            width,
            height,
            x_range,
            y_range,
            x_offset,
            y_offset,
        }
    }
}

#[wasm_bindgen]
pub struct Plotter {
    pub dimension: Dimension,
    canvas: HtmlCanvasElement,
    context: CanvasRenderingContext2d,
}

impl Plotter {
    pub fn canvas_to_plot(&self, x: f32, y: f32) -> (f32, f32) {
        (
            self.dimension.x_offset + x * self.dimension.x_range / self.dimension.width,
            self.dimension.y_offset + y * self.dimension.y_range / self.dimension.height,
        )
    }
    pub fn simd_canvas_to_plot(&self, x1: f32, y1: f32, x2: f32, y2: f32) -> [f32; 4] {
        // Formula:
        // x = x_offset + x * x_range / width
        // y = y_offset + y * y_range / height
        unsafe {
            let _source_points = f32x4(x1, y1, x2, y2);
            let _ranges =
                v128_load64_splat(std::ptr::addr_of!(self.dimension.x_range) as *const u64);
            let _sizes = v128_load64_splat(std::ptr::addr_of!(self.dimension.width) as *const u64);
            let _offsets =
                v128_load64_splat(std::ptr::addr_of!(self.dimension.x_offset) as *const u64);
            let _mul = f32x4_mul(_source_points, _ranges);
            let _div = f32x4_div(_mul, _sizes);
            let _sum = f32x4_add(_div, _offsets);
            transmute(*(std::ptr::addr_of!(_sum) as *const [f32; 4]))
        }
    }

    pub fn plot_to_canvas(&self, x: f32, y: f32) -> (f64, f64) {
        (
            ((x - self.dimension.x_offset) * self.dimension.width / self.dimension.x_range) as f64,
            ((y - self.dimension.y_offset) * self.dimension.height / self.dimension.y_range) as f64,
        )
    }

    pub fn draw_raw_data(&self, data: Clamped<&[u8]>) {
        self.context
            .put_image_data(
                &ImageData::new_with_u8_clamped_array_and_sh(
                    data,
                    self.dimension.width as u32,
                    self.dimension.height as u32,
                )
                .unwrap(),
                0.0,
                0.0,
            )
            .unwrap();
    }

    pub fn adjust_color(color: u8, k: f32) -> u8 {
        ((color as f32 / k) as u8).clamp(u8::MIN, u8::MAX)
    }
}

#[wasm_bindgen]
impl Plotter {
    #[wasm_bindgen(constructor)]
    pub fn new(
        dimension: Dimension,
        canvas: HtmlCanvasElement,
        context: CanvasRenderingContext2d,
    ) -> Plotter {
        let plotter = Plotter {
            dimension,
            canvas,
            context,
        };
        plotter.context.set_image_smoothing_enabled(false);
        plotter
    }

    #[wasm_bindgen]
    pub fn canvas_to_plot_to_js(&self, x: f32, y: f32) -> JsValue {
        let p = self.canvas_to_plot(x, y);
        JsValue::from_serde(&p).unwrap()
    }

    #[wasm_bindgen]
    pub fn resize_canvas(&self) {
        self.canvas.set_width(self.dimension.width as u32);
        self.canvas.set_height(self.dimension.height as u32);
    }

    #[wasm_bindgen]
    pub fn plot_point(&self, x: f32, y: f32, color: &JsValue, size: f64) {
        let ctx = &self.context;
        let (canvas_x, canvas_y) = self.plot_to_canvas(x, y);
        ctx.move_to(canvas_x, canvas_y);
        ctx.begin_path();
        ctx.arc(canvas_x, canvas_y, size, 0f64, 2f64 * std::f64::consts::PI)
            .unwrap();
        ctx.set_fill_style(color);
        ctx.fill();
        ctx.stroke();
        ctx.close_path();
    }

    #[wasm_bindgen]
    pub fn plot_points(
        &self,
        step_x: f32,
        step_y: f32,
        polynom: &Polynomial,
        point_size: Option<f32>,
    ) {
        if polynom.get_roots().len() == 0 {
            return;
        }

        let (width, height) = (self.dimension.width, self.dimension.height);

        let point_size = match point_size {
            Some(v) => v,
            None => 0.5,
        };

        let ctx = &self.context;
        let canvas = &self.canvas;
        ctx.clear_rect(0f64, 0f64, canvas.width().into(), canvas.height().into());

        let (x_range, y_range) = (self.dimension.x_range, self.dimension.y_range);
        // log!("x_range: {}, y_range: {}", x_range, y_range);
        let size = (((step_x + step_y) / 2.0) * ((width + height) / 2.0) * point_size / 6.0) as f64;
        ctx.set_fill_style(&"grey".into());

        let mut y = self.dimension.y_offset + step_y / 2.0;
        while y < y_range + step_y / 2.0 {
            let mut x = self.dimension.x_offset + step_x / 2.0;
            while x < x_range + step_x / 2.0 {
                let z = Complex::<f32>::new(x, y);
                // log!("Original point: {:?}", z);
                let z = polynom.calculate(z).unwrap();
                // log!("Result point: {:?}", z);
                let (canvas_x, canvas_y) = self.plot_to_canvas(z.re, z.im);
                // log!("Remapped point: ({}, {})", canvas_x, canvas_y);

                ctx.move_to(canvas_x, canvas_y);
                ctx.begin_path();
                match ctx.arc(canvas_x, canvas_y, size, 0f64, 2f64 * std::f64::consts::PI) {
                    Ok(_) => (),
                    Err(_) => (),
                };
                ctx.fill();
                ctx.stroke();
                ctx.close_path();

                x += step_x;
            }
            y += step_y;
        }

        for root in polynom.get_roots().iter() {
            let p = root.clone();
            self.plot_point(p.re, p.im, &"red".into(), 4.0 * size);
        }
    }

    #[wasm_bindgen]
    pub fn fill_pixels_nalgebra(
        &self,
        polynom: &Polynomial,
        iterations_count: usize,
        colors: JsValue,
    ) {
        let colors: Vec<[u8; 4]> = match colors.into_serde() {
            Ok(v) => v,
            Err(e) => {
                log!("Error parsing provided colors info: {}", e);
                return;
            }
        };

        let colors_len = colors.len();
        let colors =
            unsafe { std::slice::from_raw_parts(colors.as_ptr().cast::<u32>(), colors_len) };
        let mut colors_iter = colors.iter().cycle();

        let (w_int, h_int) = (
            self.dimension.width as usize,
            self.dimension.height as usize,
        );

        let roots = polynom.get_roots();
        // let root = roots[0];
        let new_data: DMatrix<u32> = DMatrix::from_fn(w_int, h_int, |x, y| {
            let mut min_d = f32::MAX;
            let mut closest_root_id: usize = 0;
            let (xp, yp) = self.canvas_to_plot(x as f32, y as f32);
            let mut p = Complex32::new(xp, yp);
            let mut i = 0;
            while i < iterations_count {
                p = polynom.newton_method_approx(p);
                i += 1;
            }
            // for _ in 0..iterations_count {
            //     log!("computing next p");
            //     p = polynom.newton_method_approx(p);
            // }
            for (i, root) in roots.iter().enumerate() {
                let d = (p - root).norm_sqr().sqrt();
                if d < min_d {
                    min_d = d;
                    closest_root_id = i;
                }
            }
            colors[closest_root_id % colors_len]
            // *colors_iter.next().unwrap() + v
        });

        let new_data = unsafe {
            std::slice::from_raw_parts(
                std::mem::transmute::<*const u32, *const u8>(new_data.data.ptr()),
                new_data.len() << 2,
            )
        };

        self.draw_raw_data(Clamped(new_data));
    }

    #[wasm_bindgen]
    #[target_feature(enable = "simd128")]
    pub fn fill_pixels_simd_nalgebra(
        &self,
        polynom: &Polynomial,
        iterations_count: usize,
        colors: JsValue,
    ) {
        let colors: Vec<[u8; 4]> = match colors.into_serde() {
            Ok(v) => v,
            Err(e) => {
                log!("Error parsing provided colors info: {}", e);
                return;
            }
        };

        let colors_len = colors.len();
        let colors =
            unsafe { std::slice::from_raw_parts(colors.as_ptr().cast::<u32>(), colors_len) };

        let Dimension {
            width,
            height,
            x_range,
            y_range,
            x_offset,
            y_offset,
        } = self.dimension;

        let (w_int, h_int) = (width as usize, height as usize);

        let roots = polynom.get_roots();

        let new_data: DMatrix<u32> = DMatrix::from_fn(w_int, h_int, |x, y| {
            let mut min_d = f32::MAX;
            let mut closest_root_id: usize = 0;
            // let (xp, yp) = self.canvas_to_plot(x as f32, y as f32);
            let points = self.simd_canvas_to_plot(x as f32, y as f32, x as f32, y as f32);
            let (xp, yp) = (points[0], points[1]);
            let mut p = Complex32::new(xp, yp);
            for _ in 0..iterations_count {
                p = polynom.simd_newton_method_approx(p);
            }
            for (i, root) in roots.iter().enumerate() {
                let d = (p - root).norm_sqr().sqrt();
                if d < min_d {
                    min_d = d;
                    closest_root_id = i;
                }
            }
            colors[closest_root_id % colors_len]
        });

        let new_data = unsafe {
            std::slice::from_raw_parts(
                std::mem::transmute::<*const u32, *const u8>(new_data.data.ptr()),
                new_data.len() << 2,
            )
        };

        self.draw_raw_data(Clamped(new_data));
    }

    #[wasm_bindgen]
    pub fn draw_newtons_fractal(
        &self,
        polynom: &Polynomial,
        iterations_count: u32,
        colors: JsValue,
        apply_effect: bool,
    ) {
        let colors: Vec<[u8; 4]> = match colors.into_serde() {
            Ok(v) => v,
            Err(e) => {
                log!("Error parsing provided colors info: {}", e);
                return;
            }
        };

        let colors_num = colors.len();

        let (width, height) = (self.dimension.width, self.dimension.height);
        let (w_int, h_int) = (width as u32, height as u32);
        let mut new_data = vec![[0u8; 4]; (width * height) as usize];
        let x0 = self.dimension.x_offset;
        let (mut x, mut y) = (x0, self.dimension.y_offset);
        let (x_step, y_step) = (
            self.dimension.x_range / width,
            self.dimension.y_range / height,
        );

        let iter_count_k = iterations_count as f32 + 1.0;

        let roots = polynom.get_roots();
        let mut index: usize = 0;
        for _ in 0..h_int {
            x = x0;
            for _ in 0..w_int {
                let mut min_d = f32::MAX;
                let mut closest_root_id: usize = usize::MAX;
                let mut p = Complex32::new(x, y);
                for _ in 0..iterations_count {
                    p = polynom.newton_method_approx(p);
                }
                for (i, root) in roots.iter().enumerate() {
                    let d = p - root;
                    let d = (d.re * d.re + d.im * d.im).sqrt();
                    if d < min_d {
                        min_d = d;
                        closest_root_id = i;
                        if d < SEARCH_TRESHOLD {
                            break;
                        }
                    }
                }
                let color = &colors[closest_root_id % colors_num];
                if apply_effect {
                    let k = (min_d.sqrt() * iter_count_k * iter_count_k).sqrt();
                    for i in 0..=2 {
                        new_data[index][i] = Plotter::adjust_color(color[i], k);
                    }
                    new_data[index][3] = color[3];
                } else {
                    new_data[index] = color.clone();
                }
                index += 1;
                x += x_step;
            }
            y += y_step;
        }

        let new_data: Vec<_> = new_data.into_iter().flatten().collect();
        self.draw_raw_data(Clamped(new_data.as_slice()));
    }

    #[wasm_bindgen]
    pub fn display_roots(&self, polynom: &Polynomial) {
        for root in polynom.get_roots().iter() {
            let p = root.clone();
            self.plot_point(p.re, p.im, &"wheat".into(), 4.0);
        }
    }
}
