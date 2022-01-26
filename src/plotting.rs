use super::polynomial::Polynomial;
use num_complex::Complex;
use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Dimension {
    pub width: f64,
    pub height: f64,
    pub x_offset: f64,
    pub y_offset: f64,
}

#[wasm_bindgen]
impl Dimension {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f64, height: f64, x_offset: f64, y_offset: f64) -> Dimension {
        Dimension {
            width,
            height,
            x_offset,
            y_offset,
        }
    }
}

#[wasm_bindgen]
pub struct Plotter {
    dimension: Dimension,
    canvas: HtmlCanvasElement,
    context: CanvasRenderingContext2d,
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
    pub fn plot_points(&self, division_parts: u32, polynom: Polynomial, point_size: Option<f64>) {
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

        let width_limit = 2.0;
        let height_limit = 2.0;
        let (step_x, step_y) = (
            2.0 * width_limit / division_parts as f64,
            2.0 * height_limit / division_parts as f64,
        );
        let size = ((step_x + step_y) / 2.0) * ((width + height) / 2.0) * point_size / 3.0;

        let mut y = -height_limit + step_y / 2.0;
        while y < height_limit + step_y / 2.0 {
            let mut x = -width_limit + step_x / 2.0;
            while x < width_limit + step_x / 2.0 {
                let z = Complex::<f64>::new(x, y);
                // log!("Original point: {:?}", z);
                let z = polynom.calculate(z).unwrap();
                // let z: MyComplex = f(z.into(), power).into();
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
            let (canvas_x, canvas_y) = self.plot_to_canvas(p.re, p.im);
            ctx.move_to(canvas_x, canvas_y);
            ctx.begin_path();
            ctx.arc(
                canvas_x,
                canvas_y,
                size * 1.5,
                0f64,
                2f64 * std::f64::consts::PI,
            )
            .unwrap();
            ctx.set_fill_style(&"red".into());
            ctx.fill();
            ctx.stroke();
            ctx.close_path();
        }
    }
}

impl Plotter {
    pub fn plot_to_canvas(&self, x: f64, y: f64) -> (f64, f64) {
        (
            (x + self.dimension.x_offset) * self.dimension.width,
            (y + self.dimension.y_offset) * self.dimension.height,
        )
    }
    pub fn canvas_to_plot(&self, x: f64, y: f64) -> (f64, f64) {
        let x = x * self.dimension.width / self.canvas.width() as f64 + self.dimension.x_offset;
        let y = y * self.dimension.height / self.canvas.height() as f64 + self.dimension.y_offset;
        (x, y)
    }
}