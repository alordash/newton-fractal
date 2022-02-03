use std::arch::wasm32::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SimdHelper;

impl SimdHelper {
    pub const INVERSION_NEG_MASK: v128 = f32x4(1.0, -1.0, 1.0, -1.0);
    pub const F64_ZEROES: v128 = f64x2(0.0f64, 0.0f64);

    #[target_feature(enable = "simd128")]
    pub fn complex_number_inversion(_vec: v128) -> v128 {
        let _numerator = f32x4_mul(_vec, SimdHelper::INVERSION_NEG_MASK);
        let _squares = f32x4_mul(_vec, _vec);
        let _shifted_squares = i32x4_shuffle::<1, 0, 3, 2>(_squares, _squares);
        let _denumerator = f32x4_add(_squares, _shifted_squares);

        f32x4_div(_numerator, _denumerator)
    }
}
