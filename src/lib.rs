#![cfg(target_arch = "wasm32")]

use wasm_bindgen::prelude::*;

#[macro_use]
mod logging;
use logging::*;

pub mod newtons_fractal;
pub mod plotting;
pub mod simd_constants;

pub mod drawing {
    pub mod config;
    pub mod modes;
    pub mod result;
    pub mod worker;
}

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
