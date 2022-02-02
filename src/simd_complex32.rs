use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use std::arch::wasm32::*;
use std::mem::transmute;

#[wasm_bindgen]
pub struct SimdComplex32;

impl SimdComplex32 {
    pub fn double_inversion(a: f32, b: f32, c: f32, d: f32) -> [f32; 4] {
        let _numerator = f32x4(a, -b, c, -d);
        let _squares = f32x4_mul(_numerator, _numerator);
        let _shifted_squares = i32x4_shuffle::<1, 0, 3, 2>(_squares, _squares);
        let _denumerator = f32x4_add(_squares, _shifted_squares);
        let _result = f32x4_div(_numerator, _denumerator);
        unsafe { transmute(_result) }
    }

    pub fn double_subtract(mre: f32, mim: f32, a: f32, b: f32, c: f32, d: f32) -> [f32; 4] {
        let _minuend = f32x4(mre, mim, mre, mim);
        let _subtrahend = f32x4(a, b, c, d);
        let _result = f32x4_sub(_minuend, _subtrahend);
        unsafe { transmute(_result) }
    }

    pub fn double_add(tre: f32, tim: f32, a: f32, b: f32, c: f32, d: f32) -> [f32; 4] {
        let _minuend = f32x4(tre, tim, tre, tim);
        let _subtrahend = f32x4(a, b, c, d);
        let _result = f32x4_add(_minuend, _subtrahend);
        unsafe { transmute(_result) }
    }
}

#[wasm_bindgen]
impl SimdComplex32 {
    #[wasm_bindgen]
    pub fn double_inversion_to_js(a: f32, b: f32, c: f32, d: f32) -> JsValue {
        let result = SimdComplex32::double_inversion(a, b, c, d);
        JsValue::from_serde(&result).unwrap()
    }

    #[wasm_bindgen]
    pub fn double_subtract_to_js(mre: f32, mim: f32, a: f32, b: f32, c: f32, d: f32) -> JsValue {
        let result = SimdComplex32::double_subtract(mre, mim, a, b, c, d);
        JsValue::from_serde(&result).unwrap()
    }

    #[wasm_bindgen]
    pub fn double_add_to_js(tre: f32, tim: f32, a: f32, b: f32, c: f32, d: f32) -> JsValue {
        let result = SimdComplex32::double_add(tre, tim, a, b, c, d);
        JsValue::from_serde(&result).unwrap()
    }
}
