#![cfg(target_arch = "wasm32")]

use std::alloc::{alloc, dealloc, Layout};
use wasm_bindgen::prelude::*;

#[macro_use]
mod logging;

pub mod fractal_calculation;
pub mod geometry_math;
pub mod plotting;
pub mod simd_math;

#[wasm_bindgen]
pub fn get_wasm_memory() -> JsValue {
    wasm_bindgen::memory()
}

#[wasm_bindgen]
pub fn create_u32_buffer(size: usize) -> Option<u32> {
    // log!("Creating buffer with {} u32 items", size);
    let layout = match Layout::array::<u32>(size) {
        Ok(v) => v,
        Err(e) => {
            log!(
                "Error creating layout for u32 array of {} items: {:?}",
                size,
                &e
            );
            return None;
        }
    };
    let buffer_ptr = unsafe { alloc(layout) } as *mut u32;
    Some(buffer_ptr as u32)
}

#[wasm_bindgen]
pub fn free_u32_buffer(size: usize, buffer_ptr: *mut u32) {
    match Layout::array::<u32>(size) {
        Ok(layout) => unsafe {
            dealloc(buffer_ptr as *mut u8, layout);
        },
        Err(e) => {
            log!(
                "MEMORY LEAK: Error creating dealloc layout for array of {} items: {:?}",
                size,
                &e
            );
        }
    };
}

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("Initialized");
    Ok(())
}
