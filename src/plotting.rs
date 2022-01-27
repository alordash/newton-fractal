use crate::approximation::Approximation;

use super::polynomial::Polynomial;
use js_sys::Math::sqrt;
use num_complex::{Complex, Complex64};
use wasm_bindgen::{prelude::*, Clamped};
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement, ImageData};

use super::logger::*;

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Dimension {
    pub width: f64,
    pub height: f64,
    pub x_range: f64,
    pub y_range: f64,
    pub x_offset: f64,
    pub y_offset: f64,
}

#[wasm_bindgen]
impl Dimension {
    #[wasm_bindgen(constructor)]
    pub fn new(
        width: f64,
        height: f64,
        x_range: f64,
        y_range: f64,
        x_offset: f64,
        y_offset: f64,
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
    pub fn canvas_to_plot(&self, x: f64, y: f64) -> (f64, f64) {
        (
            self.dimension.x_offset + x * self.dimension.x_range / self.dimension.width,
            self.dimension.y_offset + y * self.dimension.y_range / self.dimension.height,
        )
    }

    pub fn plot_to_canvas(&self, x: f64, y: f64) -> (f64, f64) {
        (
            (x - self.dimension.x_offset) * self.dimension.width / self.dimension.x_range,
            (y - self.dimension.y_offset) * self.dimension.height / self.dimension.y_range,
        )
    }

    pub fn draw_raw_data(&self, data: Clamped<&[u8]>) {
        let (width, height) = (self.dimension.width, self.dimension.height);
        let new_image_data =
            match ImageData::new_with_u8_clamped_array_and_sh(data, width as u32, height as u32) {
                Ok(v) => v,
                Err(e) => {
                    log!(
                        "Error creating new image data of size {}x{}: {:?}",
                        width,
                        height,
                        e
                    );
                    return;
                }
            };
        match self.context.put_image_data(&new_image_data, 0.0, 0.0) {
            Ok(_) => log!("Successfully modified values in image data and applied them."),
            Err(e) => log!("Error applying modified image: {:?}", e),
        }
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
        Plotter {
            dimension,
            canvas,
            context,
        }
    }

    #[wasm_bindgen]
    pub fn canvas_to_plot_to_js(&self, x: f64, y: f64) -> JsValue {
        let p = self.canvas_to_plot(x, y);
        JsValue::from_serde(&p).unwrap()
    }

    #[wasm_bindgen]
    pub fn resize_canvas(&self) {
        self.canvas.set_width(self.dimension.width as u32);
        self.canvas.set_height(self.dimension.height as u32);
    }

    #[wasm_bindgen]
    pub fn plot_point(&self, x: f64, y: f64, color: &JsValue, size: f64) {
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
        step_x: f64,
        step_y: f64,
        polynom: &Polynomial,
        approximation: &Approximation,
        point_size: Option<f64>,
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
        log!("x_range: {}, y_range: {}", x_range, y_range);
        let size = ((step_x + step_y) / 2.0) * ((width + height) / 2.0) * point_size / 6.0;
        ctx.set_fill_style(&"grey".into());

        let mut y = self.dimension.y_offset + step_y / 2.0;
        while y < y_range + step_y / 2.0 {
            let mut x = self.dimension.x_offset + step_x / 2.0;
            while x < x_range + step_x / 2.0 {
                let z = Complex::<f64>::new(x, y);
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

        for point in approximation.get_points().iter() {
            let p = point.clone();
            self.plot_point(p.re, p.im, &"blue".into(), 3.0 * size);
        }
    }

    #[wasm_bindgen]
    pub fn reverse_colors(&self) {
        let (width, height) = (self.dimension.width, self.dimension.height);
        match self.context.get_image_data(0.0, 0.0, width, height) {
            Ok(image_data) => {
                let mut data = image_data.data();
                for i in (0..data.len()).step_by(4) {
                    data[i] ^= 255;
                    data[i + 1] ^= 255;
                    data[i + 2] ^= 255;
                }
                self.draw_raw_data(Clamped(data.as_slice()));
            }
            Err(e) => log!("Error getting canvas image data: {:?}", e),
        }
    }

    #[wasm_bindgen]
    pub fn draw_voronoi_tesselation(&self, polynom: &Polynomial, colors: JsValue) {
        let colors: Vec<[u8; 4]> = match colors.into_serde() {
            Ok(v) => v,
            Err(e) => {
                log!("Error parsing provided colors info: {}", e);
                return;
            }
        };

        let colors_num = colors.len();

        log!("Got {} colors: {:?}", colors_num, colors);

        let (width, height) = (self.dimension.width, self.dimension.height);
        let (w_int, h_int) = (width as u32, height as u32);
        let mut new_data = vec![[0u8; 4]; (width * height) as usize];
        let x0 = self.dimension.x_offset;
        let (mut x, mut y) = (x0, self.dimension.y_offset);
        let (x_step, y_step) = (
            self.dimension.x_range / width,
            self.dimension.y_range / height,
        );

        let roots = polynom.get_roots();
        let mut index: usize = 0;
        for yp in 0..h_int {
            x = x0;
            for xp in 0..w_int {
                let mut min_d = f64::MAX;
                let mut closest_root_id: usize = 0;
                let p = Complex64::new(x, y);
                for (i, root) in roots.iter().enumerate() {
                    let d = p - root;
                    let d = sqrt(d.re * d.re + d.im * d.im);
                    if d < min_d {
                        min_d = d;
                        closest_root_id = i;
                    }
                }
                new_data[index] = colors[closest_root_id % colors_num];
                index += 1;
                x += x_step;
            }
            y += y_step;
        }

        let new_data: Vec<_> = new_data.into_iter().flatten().collect();
        self.draw_raw_data(Clamped(new_data.as_slice()));
    }
}
