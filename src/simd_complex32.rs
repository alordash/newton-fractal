use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use std::arch::wasm32::*;
use std::mem::transmute;

#[wasm_bindgen]
pub struct SimdComplex32;

impl SimdComplex32 {
    pub fn double_inversion(two_complex: [f32; 4]) -> [f32; 4] {
        let _numerator = f32x4(
            two_complex[0],
            -two_complex[1],
            two_complex[2],
            -two_complex[3],
        );
        let _squares = f32x4_mul(_numerator, _numerator);
        let _shifted_squares = i32x4_shuffle::<1, 0, 3, 2>(_squares, _squares);
        let _denumerator = f32x4_add(_squares, _shifted_squares);
        let _result = f32x4_div(_numerator, _denumerator);
        unsafe { transmute(_result) }
    }

    pub fn double_subtract(minuend: [f32; 2], subtrahend: [f32; 4]) -> [f32; 4] {
        let _minuend = unsafe { v128_load64_splat(minuend.as_ptr() as *const u64) };
        let _subtrahend = unsafe { v128_load(subtrahend.as_ptr() as *const v128) };
        let _result = f32x4_sub(_minuend, _subtrahend);
        unsafe { transmute(_result) }
    }

    pub fn double_add(base_term: [f32; 2], two_terms: [f32; 4]) -> [f32; 4] {
        let _minuend = unsafe { v128_load64_splat(base_term.as_ptr() as *const u64) };
        let _subtrahend = unsafe { v128_load(two_terms.as_ptr() as *const v128) };
        let _result = f32x4_add(_minuend, _subtrahend);
        unsafe { transmute(_result) }
    }
}

#[wasm_bindgen]
impl SimdComplex32 {
    #[wasm_bindgen]
    pub fn double_inversion_to_js(a: f32, b: f32, c: f32, d: f32) -> JsValue {
        let result = SimdComplex32::double_inversion([a, b, c, d]);
        JsValue::from_serde(&result).unwrap()
    }

    #[wasm_bindgen]
    pub fn double_subtract_to_js(mre: f32, mim: f32, a: f32, b: f32, c: f32, d: f32) -> JsValue {
        let result = SimdComplex32::double_subtract([mre, mim], [a, b, c, d]);
        JsValue::from_serde(&result).unwrap()
    }

    #[wasm_bindgen]
    pub fn double_add_to_js(tre: f32, tim: f32, a: f32, b: f32, c: f32, d: f32) -> JsValue {
        let result = SimdComplex32::double_add([tre, tim], [a, b, c, d]);
        JsValue::from_serde(&result).unwrap()
    }
}
