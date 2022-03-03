#![cfg(target_arch = "wasm32")]

use wasm_bindgen::prelude::*;

#[macro_use]
mod logger;
use logger::*;

pub mod simd_constants;

pub mod newtons_fractal;

pub mod plotting;

#[wasm_bindgen]
pub fn create_buffer(capacity: usize) -> *mut u32 {
    let mut buf = Vec::<u32>::with_capacity(capacity);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("Test: {}", "log");
    Ok(())
}
