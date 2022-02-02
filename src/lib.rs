#![cfg(target_arch = "wasm32")]

use num_complex::Complex32;
use wasm_bindgen::prelude::*;

#[macro_use]
mod logger;
use logger::*;

pub mod simd_constants;

pub mod polynomial;
use polynomial::Polynomial;

pub mod plotting;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("Test: {}", "log");
    Ok(())
}