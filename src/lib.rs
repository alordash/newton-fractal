#![cfg(target_arch = "wasm32")]

use wasm_bindgen::prelude::*;

#[macro_use]
mod logging;
use logging::*;

pub mod drawing_config;
pub mod newtons_fractal;
pub mod plotting;
pub mod simd_constants;

#[wasm_bindgen]
pub fn foo() -> usize {
    42
}

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("Test: {}", "log");
    Ok(())
}
