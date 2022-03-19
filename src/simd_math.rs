use std::arch::wasm32::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SimdMath;

impl SimdMath {
    pub const NEGATION_MASK_FOR_INVERSION: v128 = f32x4(1.0, -1.0, 1.0, -1.0);
    pub const F64_ZEROES: v128 = f64x2(0.0f64, 0.0f64);
    pub const F32_MAXIMUMS: v128 = f32x4(f32::MAX, f32::MAX, f32::MAX, f32::MAX);
    pub const I32_ZEROES: v128 = i32x4(0, 0, 0, 0);

    #[target_feature(enable = "simd128")]
    pub fn complex_number_inversion(_vec: v128) -> v128 {
        let _numerator = f32x4_mul(_vec, SimdMath::NEGATION_MASK_FOR_INVERSION);
        let _squares = f32x4_mul(_vec, _vec);
        let _shifted_squares = i32x4_shuffle::<1, 0, 3, 2>(_squares, _squares);
        let _denumerator = f32x4_add(_squares, _shifted_squares);

        f32x4_div(_numerator, _denumerator)
    }

    #[target_feature(enable = "simd128")]
    pub fn calculate_distance(_points1: v128, _points2: v128) -> v128 {
        let _diff = f32x4_sub(_points1, _points2);
        let _squares = f32x4_mul(_diff, _diff);
        let _shifted_squares = i32x4_shuffle::<1, 0, 3, 2>(_squares, _squares);
        let _sum = f32x4_add(_squares, _shifted_squares);
        f32x4_sqrt(_sum)
    }
}
