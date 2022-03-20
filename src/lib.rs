#![cfg(target_arch = "wasm32")]

use wasm_bindgen::prelude::*;

#[macro_use]
mod logging;

pub mod fractal_calculation;
pub mod geometry_math;
pub mod fractal_plotting;
pub mod simd_math;
pub mod memory_manager;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("Initialized");
    Ok(())
}
