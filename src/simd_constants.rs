use std::arch::wasm32::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SimdConstants;

impl SimdConstants {
    pub const INVERSION_NEG_MASK: v128 = f32x4(1.0, -1.0, 1.0, -1.0);
    pub const F64_ZEROES: v128 = f64x2(0.0f64, 0.0f64);
}
