use std::arch::wasm32::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SimdMath;

impl SimdMath {
    pub const NEGATION_MASK_FOR_INVERSION: v128 = f32x4(1.0, -1.0, 1.0, -1.0);
    pub const F64_ZEROES: v128 = f64x2(0.0f64, 0.0f64);
    pub const F32_MAXIMUMS: v128 = f32x4(f32::MAX, f32::MAX, f32::MAX, f32::MAX);
    pub const I32_ZEROES: v128 = i32x4(0, 0, 0, 0);

    // Formula:
    //   1 / z
    // = 1 / (a + bi)
    // = a / (a^2 + b^2) - bi / (a^2 + b^2)
    // Real:        a / (a^2 + b^2)
    // Imagine:    -b / (a^2 + b^2)
    #[target_feature(enable = "simd128")]
    pub fn complex_number_inversion(_vec: v128) -> v128 {
        // [a, -b, a, -b]
        let _numerator = f32x4_mul(_vec, SimdMath::NEGATION_MASK_FOR_INVERSION);

        // [a^2, b^2, a^2, b^2]
        let _squares = f32x4_mul(_vec, _vec);

        // [b^2, a^2, b^2, a^2]
        let _shifted_squares = i32x4_shuffle::<1, 0, 3, 2>(_squares, _squares);

        // [
        //     a^2 + b^2,
        //     a^2 + b^2,
        //     a^2 + b^2,
        //     a^2 + b^2
        // ]
        let _denumerator = f32x4_add(_squares, _shifted_squares);

        // [
        //     a / (a^2 + b^2),
        //    -b / (a^2 + b^2),
        //     a / (a^2 + b^2),
        //    -b / (a^2 + b^2)
        // ]
        f32x4_div(_numerator, _denumerator)
    }

    // Formula:
    // Distance = sqrt((x1 - x2)^2 + (y1 - y2)^2)
    // _points1: (x1, y1, x3, y3)
    // _points2: (x2, y2, x4, y4)
    #[target_feature(enable = "simd128")]
    pub fn calculate_distance(_points1: v128, _points2: v128) -> v128 {
        // [
        //     x1 - x2,
        //     y1 - y2,
        //     x3 - x4,
        //     y3 - y4
        // ]
        let _diff = f32x4_sub(_points1, _points2);

        // For short:
        // A = x1 - x2
        // B = y1 - y2
        // C = x3 - x4
        // D = y3 - y4
        // [A^2, B^2, C^2, D^2]
        let _squares = f32x4_mul(_diff, _diff);

        // [B^2, A^2, D^2, C^2]
        let _shifted_squares = i32x4_shuffle::<1, 0, 3, 2>(_squares, _squares);

        // [
        //     A^2 + B^2,
        //     A^2 + B^2,
        //     C^2 + D^2,
        //     C^2 + D^2
        // ]
        let _sum = f32x4_add(_squares, _shifted_squares);

        // [
        //     sqrt(A^2 + B^2),
        //     sqrt(A^2 + B^2),
        //     sqrt(C^2 + D^2),
        //     sqrt(C^2 + D^2)
        // ]
        f32x4_sqrt(_sum)
    }
}
