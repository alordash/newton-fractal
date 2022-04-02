use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use std::arch::wasm32::*;
use std::ptr::addr_of;

use crate::simd_math::SimdMath;

pub fn get_root_id(mut z: Complex32, roots: &[Complex32], iterations_count: usize) -> usize {
    // Newton's method approximation is performed inside of this cycle
    for _ in 0..iterations_count {
        let mut sum = Complex32::new(0.0, 0.0);
        for (i, root) in roots.iter().enumerate() {
            let mut diff = z - root;
            let square_norm = diff.norm_sqr();

            if square_norm < 0.001 {
                return i;
            }

            // sum += 1.0 / diff
            diff.re /= square_norm;
            diff.im /= -square_norm;
            sum += diff;
        }

        z -= 1.0 / sum;
    }

    let mut min_distance = f32::MAX;
    let mut closest_root_id: usize = 0;

    for (i, root) in roots.iter().enumerate() {
        let distance = (z - root).norm_sqr();
        if distance < min_distance {
            min_distance = distance;
            closest_root_id = i;
        }
    }
    closest_root_id
}


#[wasm_bindgen]
pub fn get_root_id_wasm(x: f32, y: f32, roots: JsValue, iterations_count: usize) -> usize {
    let z = Complex32 { re: x, im: y };
    let roots: Vec<(f32, f32)> = roots.into_serde().unwrap();
    let complex_roots: Vec<Complex32> = roots
        .iter()
        .map(|pair| Complex32 {
            re: pair.0,
            im: pair.1,
        })
        .collect();

    get_root_id(z, &complex_roots, iterations_count)
}

#[inline]
#[target_feature(enable = "simd128")]
pub unsafe fn simd_newton_method_approx_for_two_numbers(two_z: v128, roots: &[Complex32]) -> v128 {
    let ptr = addr_of!(two_z) as *const u64;
    u64x2(
        simd_newton_method_approx(*ptr, roots),
        simd_newton_method_approx(*(ptr.offset(1)), roots),
    )
}

#[inline]
#[target_feature(enable = "simd128")]
pub fn simd_newton_method_approx(z: u64, roots: &[Complex32]) -> u64 {
    // In scalar implementation we process only one root at a time.
    // Using SIMD commands we can process two roots at the same time.
    // We create f32x4 vector [A, B, C, D], in which 'A' and 'B' are "real" and
    // "imaginary" parts of first complex value and 'C' and 'D' are "real"
    // and "imaginary" parts of second complex value as well.

    let mut _sum = f32x4_splat(0.0);
    let _z = unsafe { v128_load64_splat(&z) };
    let roots_chunks_iter = roots.chunks_exact(2);
    let rem = roots_chunks_iter.remainder();
    for roots_chunk in roots_chunks_iter {
        unsafe {
            // General formula: sum += 1.0 / (z - root)
            // 1. Subtraction: z - root
            let _diff = f32x4_sub(_z, *(roots_chunk.as_ptr() as *const v128));

            // 1*. Check: if (difference < 0.001) => z is one of roots
            let _diff_le = f32x4_lt(f32x4_abs(_diff), SimdMath::F32_MIN_DIFFS);
            if v128_any_true(v128_and(
                _diff_le,
                i32x4_shuffle::<1, 0, 3, 2>(_diff_le, _diff_le),
            )) {
                return z;
            }

            // 2. Inversion: 1.0 / (z - root)
            let _inversion = SimdMath::complex_number_inversion(_diff);

            // 3. Addition: sum += 1.0 / (z - root)
            _sum = f32x4_add(_sum, _inversion);
        }
    }
    // Move second complex values to two first lanes
    let _sum_shift = i64x2_shuffle::<1, 0>(_sum, _sum);

    // Process odd root
    if let Some(rem) = rem.get(0) {
        unsafe {
            // This part of code does exactly what the previous cycle does,
            // except second complex value in vector is equal to 0: [A, B, 0, 0];

            let rem_as_u64 = addr_of!(*rem) as *const u64;
            let _diff = f32x4_sub(_z, v128_load64_zero(rem_as_u64));

            let _diff_le = f32x4_lt(f32x4_abs(_diff), SimdMath::F32_MIN_DIFFS);
            if v128_any_true(v128_and(
                _diff_le,
                i32x4_shuffle::<1, 0, 3, 2>(_diff_le, _diff_le),
            )) {
                return z;
            }
            
            let _inversion = SimdMath::complex_number_inversion(_diff);

            _sum = f32x4_add(_sum, _inversion);
        }
    }

    // Sum first and second complex values
    _sum = f32x4_add(_sum, _sum_shift);

    // Return value: z - 1.0 / sum
    unsafe {
        let _inversion = SimdMath::complex_number_inversion(_sum);
        let _sub = f32x4_sub(_z, _inversion);
        *(addr_of!(_sub) as *const u64)
    }
}
