use std::arch::wasm32::*;

pub struct SimdMath;

impl SimdMath {
    pub const _F32_ZERO: v128 = f32x4(0.0, 0.0, 0.0, 0.0);
    pub const _F32_MAX: v128 = f32x4(f32::MAX, f32::MAX, f32::MAX, f32::MAX);
    pub const _I32_ZERO: v128 = i32x4(0, 0, 0, 0);
    pub const _NEGATION_MASK_FOR_INVERSION: v128 = f32x4(1.0, -1.0, 1.0, -1.0);

    // a % b = a - b * floor(a / b)
    #[target_feature(enable = "simd128")]
    pub fn f32x4_mod(_a: v128, _b: v128) -> v128 {
        f32x4_sub(_a, f32x4_mul(_b, f32x4_floor(f32x4_div(_a, _b))))
    }

    // Formula
    // Square norm of z (a: re, b: im) = a^2 + b^2
    #[target_feature(enable = "simd128")]
    pub fn calculate_square_norms(_vec: v128) -> v128 {
        // [a^2, b^2, a^2, b^2]
        let _squares = f32x4_mul(_vec, _vec);

        // [b^2, a^2, b^2, a^2]
        let _shifted_squares = i8x16_swizzle(
            _squares,
            i8x16(4, 5, 6, 7, 0, 1, 2, 3, 12, 13, 14, 15, 8, 9, 10, 11),
        );

        // [
        //     a^2 + b^2,
        //     a^2 + b^2,
        //     a^2 + b^2,
        //     a^2 + b^2
        // ]
        f32x4_add(_squares, _shifted_squares)
    }

    // Formula:
    //   1 / z
    // = 1 / (a + bi)
    // = a / (a^2 + b^2) - bi / (a^2 + b^2)
    // Real:        a / (a^2 + b^2)
    // Imagine:    -b / (a^2 + b^2)
    #[target_feature(enable = "simd128")]
    pub fn complex_numbers_inversion(_vec: v128) -> v128 {
        // [a, -b, a, -b]
        let _numerators = f32x4_mul(_vec, SimdMath::_NEGATION_MASK_FOR_INVERSION);

        // [
        //     a^2 + b^2,
        //     a^2 + b^2,
        //     a^2 + b^2,
        //     a^2 + b^2
        // ]
        let _denumerators = SimdMath::calculate_square_norms(_numerators);

        // [
        //       a / (a^2 + b^2),
        //      -b / (a^2 + b^2),
        //       a / (a^2 + b^2),
        //      -b / (a^2 + b^2)
        // ]
        f32x4_div(_numerators, _denumerators)
    }

    // Formula:
    // Distance = sqrt((x1 - x2)^2 + (y1 - y2)^2)
    // _points1: (x1, y1, x3, y3)
    // _points2: (x2, y2, x4, y4)
    #[target_feature(enable = "simd128")]
    pub fn calculate_squared_distances(_points1: v128, _points2: v128) -> v128 {
        // [
        //      x1 - x2 (= A),
        //      y1 - y2 (= B),
        //      x3 - x4 (= C),
        //      y3 - y4 (= D)
        // ]
        let _diffs = f32x4_sub(_points1, _points2);

        // [
        //     A^2 + B^2,
        //     A^2 + B^2,
        //     C^2 + D^2,
        //     C^2 + D^2
        // ]
        SimdMath::calculate_square_norms(_diffs)
    }
}
