use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use std::arch::wasm32::*;
use std::mem::transmute;
use std::ptr::addr_of;

use crate::geometry::{simd_transform_point_to_plot_scale, PlotScale};
use crate::simd_math::SimdMath;

pub const MIN_DIFF: f32 = 0.001;
pub const _MIN_DIFFS: v128 = f32x4(MIN_DIFF, MIN_DIFF, MIN_DIFF, MIN_DIFF);

pub fn get_root_id(mut z: Complex32, roots: &[Complex32], iterations_count: usize) -> usize {
    // Newton's method approximation is performed inside of this cycle
    for _ in 0..iterations_count {
        let mut sum = Complex32::new(0.0, 0.0);
        for (i, root) in roots.iter().enumerate() {
            let mut diff = z - root;
            let square_norm = diff.norm_sqr();

            if square_norm < MIN_DIFF {
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

#[target_feature(enable = "simd128")]
pub unsafe fn simd_get_root_id(
    _xs: v128,
    _ys: v128,
    roots: &[Complex32],
    iterations_count: usize,
    plot_scale: &PlotScale,
) -> (usize, usize, usize, usize) {
    let mut _min_distances = SimdMath::_F32_MAX;
    let mut _closest_root_ids = SimdMath::_I32_ZERO;

    let mut _points1 = f32x4(
        f32x4_extract_lane::<0>(_xs),
        f32x4_extract_lane::<0>(_ys),
        f32x4_extract_lane::<1>(_xs),
        f32x4_extract_lane::<1>(_ys),
    );
    let mut _points2 = f32x4(
        f32x4_extract_lane::<2>(_xs),
        f32x4_extract_lane::<2>(_ys),
        f32x4_extract_lane::<3>(_xs),
        f32x4_extract_lane::<3>(_ys),
    );

    _points1 = simd_transform_point_to_plot_scale(_points1, &plot_scale);
    _points2 = simd_transform_point_to_plot_scale(_points2, &plot_scale);
    for _ in 0..iterations_count {
        _points1 = simd_newton_method_approx_for_two_numbers(_points1, &roots);
        _points2 = simd_newton_method_approx_for_two_numbers(_points2, &roots);
    }
    for (i, &root) in roots.iter().enumerate() {
        let _ids = i32x4_splat(i as i32);
        let _roots = v128_load64_splat(addr_of!(root) as *const u64);
        let _dists1 = SimdMath::calculate_squared_distances(_points1, _roots);
        let _dists2 = SimdMath::calculate_squared_distances(_points2, _roots);
        let _distances = i32x4_shuffle::<0, 2, 4, 6>(_dists1, _dists2);

        let _le_check = f32x4_lt(_distances, _min_distances);
        _min_distances = f32x4_pmin(_distances, _min_distances);
        _closest_root_ids = v128_bitselect(_ids, _closest_root_ids, _le_check);
    }

    return transmute(_closest_root_ids);
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

    let mut _sums = SimdMath::_F32_ZERO;
    let _z = unsafe { v128_load64_splat(&z) };
    let roots_chunks_iter = roots.chunks_exact(2);
    let rem = roots_chunks_iter.remainder();
    for roots_chunk in roots_chunks_iter {
        unsafe {
            // General formula: sum += 1.0 / (z - root)
            // 1. Subtraction: z - root
            let _diffs = f32x4_sub(_z, *(roots_chunk.as_ptr() as *const v128));

            let _square_norms = SimdMath::calculate_square_norms(_diffs);

            // 1*. Check: if (difference < 0.001) => z is one of roots
            if v128_any_true(f32x4_lt(_square_norms, _MIN_DIFFS)) {
                return z;
            }

            // 2. Inversion: 1.0 / (z - root)
            let mut _inversions = f32x4_mul(_diffs, SimdMath::_NEGATION_MASK_FOR_INVERSION);
            _inversions = f32x4_div(_inversions, _square_norms);

            // 3. Addition: sum += 1.0 / (z - root)
            _sums = f32x4_add(_sums, _inversions);
        }
    }
    // Move second complex values to two first lanes
    let _sums_shifted = i8x16_swizzle(
        _sums,
        i8x16(8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7),
    );

    // Process odd root
    if let Some(rem) = rem.get(0) {
        unsafe {
            // This part of code does exactly what the previous cycle does,
            // except second complex value in vector is equal to 0: [A, B, 0, 0];

            let _diffs = f32x4_sub(_z, v128_load64_zero(addr_of!(*rem) as *const u64));

            let _square_norms = SimdMath::calculate_square_norms(_diffs);

            if (i8x16_extract_lane::<0>(f32x4_lt(_square_norms, _MIN_DIFFS)) & 1) == 1 {
                return z;
            }

            let mut _inversions = f32x4_mul(_diffs, SimdMath::_NEGATION_MASK_FOR_INVERSION);
            _inversions = f32x4_div(_inversions, _square_norms);

            _sums = f32x4_add(_sums, _inversions);
        }
    }

    // Sum first and second complex values
    _sums = f32x4_add(_sums, _sums_shifted);

    // Return value: z - 1.0 / sum
    unsafe {
        let _inversions = SimdMath::complex_numbers_inversion(_sums);
        let _subs = f32x4_sub(_z, _inversions);
        *(addr_of!(_subs) as *const u64)
    }
}
