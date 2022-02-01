use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use std::arch::wasm32::*;
use std::mem::transmute;

#[wasm_bindgen]
pub struct SimdComplex32 {
    pub re: f32,
    pub im: f32,
}

impl From<Complex32> for SimdComplex32 {
    fn from(z: Complex32) -> Self {
        Self { re: z.re, im: z.im }
    }
}

impl SimdComplex32 {
    pub fn doulbe_inversion(
        SimdComplex32 { re: a, im: b }: SimdComplex32,
        SimdComplex32 { re: c, im: d }: SimdComplex32,
    ) -> (SimdComplex32, SimdComplex32) {
        let _numerator = f32x4(a, -b, c, -d);
        let _squares = f32x4_mul(_numerator, _numerator);
        let _shifted_squares = i32x4_shuffle::<1, 0, 3, 2>(_squares, _squares);
        let _denumerator = f32x4_add(_squares, _shifted_squares);
        let _result = f32x4_div(_numerator, _denumerator);
        unsafe { transmute(_result) }
    }
}

#[wasm_bindgen]
impl SimdComplex32 {
    #[wasm_bindgen(constructor)]
    pub fn new(re: f32, im: f32) -> SimdComplex32 {
        SimdComplex32 { re, im }
    }

    #[wasm_bindgen]
    pub fn double_inversion_to_js(a: f32, b: f32, c: f32, d: f32) -> JsValue {
        let result =
            SimdComplex32::doulbe_inversion(SimdComplex32::new(a, b), SimdComplex32::new(c, d));
        JsValue::from_serde(&unsafe {
            transmute::<(SimdComplex32, SimdComplex32), [f32; 4]>(result)
        })
        .unwrap()
    }
}
