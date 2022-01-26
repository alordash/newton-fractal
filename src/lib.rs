use num_complex::Complex;
use wasm_bindgen::{prelude::*, JsCast};
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};

#[macro_use]
mod logger;
use logger::*;

pub mod polynomial;
use polynomial::*;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("asd {}", 1);
    Ok(())
}

fn remap_coords(z: Complex<f64>, width: f64, height: f64) -> (f64, f64) {
    ((z.re + 0.5) * width, (z.im + 0.5) * height)
}

#[wasm_bindgen]
pub fn draw_grid(
    canvas: HtmlCanvasElement,
    context: CanvasRenderingContext2d,
    division_parts: u32,
    polynom: Polynomial,
    width: Option<u32>,
    height: Option<u32>,
    point_size: Option<f64>,
) {
    if polynom.get_roots().len() == 0 {
        return;
    }

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

    for root in polynom.get_roots().iter() {
        let (canvas_x, canvas_y) = remap_coords(root.clone(), width, height);
        context.move_to(canvas_x, canvas_y);
        context.begin_path();
        context.arc(canvas_x, canvas_y, size * 1.5, 0f64, 2f64 * std::f64::consts::PI).unwrap();
        context.set_fill_style(&"red".into());
        context.fill();
        context.stroke();
        context.close_path();
    }
}
