#![cfg(target_arch = "wasm32")]

use wasm_bindgen::prelude::*;

#[macro_use]
mod logging;
use logging::*;

pub mod newtons_fractal;
pub mod plotting;
pub mod simd_constants;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("Initialized");
    Ok(())
}
