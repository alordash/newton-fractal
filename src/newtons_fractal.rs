use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use std::arch::wasm32::*;
use std::ptr::addr_of;

use crate::simd_constants::SimdHelper;

pub fn newton_method_approx(z: Complex32, roots: &Vec<Complex32>) -> (usize, Complex32) {
    let mut sum = Complex32::new(0.0, 0.0);
    for (i, root) in roots.iter().enumerate() {
        let diff = z - root;
        if diff.re == 0.0 && diff.im == 0.0 {
            return (i, z);
        }
        sum += 1.0 / diff;
    }
    (usize::MAX, z - 1.0 / sum)
}

#[inline]
#[target_feature(enable = "simd128")]
pub unsafe fn simd_newton_method_approx_for_two_numbers(
    two_z: v128,
    roots: &Vec<Complex32>,
) -> v128 {
    let ptr = addr_of!(two_z) as *const u64;
    u64x2(
        simd_newton_method_approx(*ptr, roots),
        simd_newton_method_approx(*(ptr.offset(1)), roots),
    )
}

#[inline]
#[target_feature(enable = "simd128")]
pub fn simd_newton_method_approx(z: u64, roots: &Vec<Complex32>) -> u64 {
    // In scalar implementation we process only one root at a time.
    // When using SIMDs, we process two roots at the same time.
    // We have f32x4 [A, B, C, D], in which (A, B): re and im parts
    // of first complex value and (C, D): re and im parts of second
    // complex value.

    let mut _sum = f32x4_splat(0.0);
    let _z = unsafe { v128_load64_splat(&z) };
    let roots_chunks_iter = roots.chunks_exact(2);
    let rem = roots_chunks_iter.remainder();
    for roots_chunk in roots_chunks_iter {
        unsafe {
            // General formula: sum += 1.0 / (z - root)
            // 1. Subtraction (z - root)
            let _diff = f32x4_sub(_z, *(roots_chunk.as_ptr() as *const v128));

            // 1*. Check if difference == 0 <=> z == one of roots
            let _diff_eq = f64x2_eq(_diff, SimdHelper::F64_ZEROES);
            if v128_any_true(_diff_eq) {
                return z;
            }

            // 2. Inversion (1.0 / _diff <=> 1.0 / (z - root))
            let _inversion = SimdHelper::complex_number_inversion(_diff);

            // 3. Addition (sum += 1.0 / (z - root))
            _sum = f32x4_add(_sum, _inversion);
        }
    }
    // Move second complex values to two first lanes
    let _sum_shift = i64x2_shuffle::<1, 0>(_sum, _sum);

    // Process odd root
    if let Some(rem) = rem.get(0) {
        unsafe {
            // This process is same as the processing of two roots, except second
            // complex value in vector is equal to 0 <=> vector: [A, B, 0, 0];

            let rem_as_u64 = addr_of!(*rem) as *const u64;
            let _diff = f32x4_sub(_z, v128_load64_zero(rem_as_u64));
            let _diff_eq = f64x2_eq(_diff, SimdHelper::F64_ZEROES);
            if v128_any_true(_diff_eq) {
                return *rem_as_u64;
            }
            let _inversion = SimdHelper::complex_number_inversion(_diff);

            _sum = f32x4_add(_sum, _inversion);
        }
    }

    // Sum first and second complex values
    _sum = f32x4_add(_sum, _sum_shift);

    // Return value: z - 1.0 / sum
    unsafe {
        let _inversion = SimdHelper::complex_number_inversion(_sum);
        let _sub = f32x4_sub(_z, _inversion);
        *(addr_of!(_sub) as *const u64)
    }
}