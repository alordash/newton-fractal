use std::arch::wasm32::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SimdMath;

impl SimdMath {
    pub const SQUARE_NORM_SWAP_MASK: v128 =
        i8x16(4, 5, 6, 7, 0, 1, 2, 3, 12, 13, 14, 15, 8, 9, 10, 11);
    pub const NEGATION_MASK_FOR_INVERSION: v128 = f32x4(1.0, -1.0, 1.0, -1.0);

    // Formula
    // a^2 + b^2
    #[inline]
    #[target_feature(enable = "simd128")]
    pub fn calculate_square_norm(_coords: v128) -> v128 {
        let _squares = f32x4_mul(_coords, _coords);
        let _swapped_squares = i8x16_swizzle(_squares, SimdMath::SQUARE_NORM_SWAP_MASK);
        f32x4_add(_squares, _swapped_squares)
    }

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

        // [
        //      a^2 + b^2,
        //      a^2 + b^2,
        //      a^2 + b^2,
        //      a^2 + b^2
        // ]
        let _square_norm = SimdMath::calculate_square_norm(_numerator);

        // [
        //       a / (a^2 + b^2),
        //      -b / (a^2 + b^2),
        //       a / (a^2 + b^2),
        //      -b / (a^2 + b^2)
        // ]
        f32x4_div(_numerator, _square_norm)
    }

    // Formula:
    // Distance = sqrt((x1 - x2)^2 + (y1 - y2)^2)
    // _points1: (x1, y1, x3, y3)
    // _points2: (x2, y2, x4, y4)
    #[target_feature(enable = "simd128")]
    pub fn calculate_distance(_points1: v128, _points2: v128) -> v128 {
        // [
        //      x1 - x2 (= A),
        //      y1 - y2 (= B),
        //      x3 - x4 (= C),
        //      y3 - y4 (= D)
        // ]
        let _diff = f32x4_sub(_points1, _points2);
        
        // [ 
        //      A^2 + B^2,
        //      A^2 + B^2,
        //      C^2 + D^2,
        //      C^2 + D^2
        // ]
        let _square_norm = SimdMath::calculate_square_norm(_diff);


        f32x4_sqrt(_square_norm)
    }
}
