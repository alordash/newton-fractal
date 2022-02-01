#![cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[macro_use]
mod logger;
use logger::*;

pub mod simd_complex32;

pub mod polynomial;

pub mod plotting;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("Test: {}", 1);
    Ok(())
}
