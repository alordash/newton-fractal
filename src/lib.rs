#![cfg(target_arch = "wasm32")]

use wasm_bindgen::prelude::*;

#[macro_use]
mod logging;
use logging::*;

pub mod newtons_fractal;
pub mod plotting;
pub mod simd_constants;
pub mod utils;

pub mod drawing {
    pub mod config;
    pub mod modes;
    pub mod result;
    pub mod worker;
}

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("Test: {}", "log");
    Ok(())
}
