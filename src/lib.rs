use num_complex::Complex;
use wasm_bindgen::{prelude::*, JsCast};
use web_sys::{console as web_console, CanvasRenderingContext2d, HtmlCanvasElement};

macro_rules! log {
    ( $( $t:tt )* ) => {
        web_console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    Ok(())
}

#[wasm_bindgen]
pub fn draw_on_canvas(canvas: HtmlCanvasElement, size: u32) -> Result<(), JsValue> {
    let canvas_dim = size * 2;
    canvas.set_width(canvas_dim);
    canvas.set_height(canvas_dim);

    let context = canvas
        .get_context("2d")?
        .unwrap()
        .dyn_into::<CanvasRenderingContext2d>()?;

    context.clear_rect(0f64, 0f64, canvas.width().into(), canvas.height().into());

    context.begin_path();
    context.arc(
        size.into(),
        size.into(),
        size.into(),
        0f64,
        2f64 * std::f64::consts::PI,
    )?;
    context.fill();
    context.stroke();

    Ok(())
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct MyComplex {
    pub re: f64,
    pub im: f64,
}

#[wasm_bindgen]
impl MyComplex {
    #[wasm_bindgen(constructor)]
    pub fn new(re: f64, im: f64) -> Self {
        MyComplex { re, im }
    }
}

impl From<Complex<f64>> for MyComplex {
    fn from(z: Complex<f64>) -> Self {
        MyComplex { re: z.re, im: z.im }
    }
}

impl Into<Complex<f64>> for MyComplex {
    fn into(self) -> Complex<f64> {
        return Complex::<f64>::new(self.re, self.im);
    }
}

fn remap_coords(z: MyComplex, width: f64, height: f64) -> (f64, f64) {
    ((z.re + 0.5) * width, (z.im + 0.5) * height)
}

fn f(z: Complex<f64>, p: f64) -> Complex<f64> {
    z.powf(p)
}

#[wasm_bindgen]
pub fn draw_grid(
    canvas: HtmlCanvasElement,
    context: CanvasRenderingContext2d,
    division_parts: u32,
    power: f64,
    width: Option<u32>,
    height: Option<u32>,
    point_size: Option<f64>,
) {
    let width = match width {
        Some(v) => {
            canvas.set_width(v);
            v
        }
        None => canvas.width(),
    } as f64;
    let height = match height {
        Some(v) => {
            canvas.set_height(v);
            v
        }
        None => canvas.height(),
    } as f64;
    let point_size = match point_size {
        Some(v) => v,
        None => 0.5,
    };

    context.clear_rect(0f64, 0f64, canvas.width().into(), canvas.height().into());

    let width_limit = 1.0;
    let height_limit = 1.0;
    let (step_x, step_y) = (
        2.0 * width_limit / division_parts as f64,
        2.0 * height_limit / division_parts as f64,
    );
    let size = ((step_x + step_y) / 2.0) * ((width + height) / 2.0) * point_size / 3.0;

    let mut y = -height_limit + step_y / 2.0;
    while y < height_limit + step_y / 2.0 {
        let mut x = -width_limit + step_x / 2.0;
        while x < width_limit + step_x / 2.0 {
            let z = MyComplex { re: x, im: y };
            // log!("Original point: {:?}", z);
            // let z = eval_expr(expr, z).unwrap();
            let z: MyComplex = f(z.into(), power).into();
            // log!("Result point: {:?}", z);
            let (canvas_x, canvas_y) = remap_coords(z, width, height);
            // log!("Remapped point: ({}, {})", canvas_x, canvas_y);

            context.move_to(canvas_x, canvas_y);
            context.begin_path();
            match context.arc(canvas_x, canvas_y, size, 0f64, 2f64 * std::f64::consts::PI) {
                Ok(_) => (),
                Err(_) => (),
            };
            context.fill();
            context.stroke();
            context.close_path();

            x += step_x;
        }
        y += step_y;
    }
}
