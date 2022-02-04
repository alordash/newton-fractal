use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use std::{arch::wasm32::*, intrinsics::transmute};

use crate::simd_constants::SimdHelper;

use super::logger::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct Polynomial {
    roots: Vec<Complex32>,
}

#[wasm_bindgen]
impl Polynomial {
    #[wasm_bindgen(constructor)]
    pub fn new(roots: &JsValue) -> Option<Polynomial> {
        let roots: Vec<(f32, f32)> = match roots.into_serde() {
            Ok(v) => v,
            Err(_) => {
                log!("Error getting roots from: {:?}", roots);
                return None;
            }
        };

        Some(Polynomial {
            roots: roots
                .iter()
                .map(|(re, im)| Complex32 { re: *re, im: *im })
                .collect(),
        })
    }

    #[wasm_bindgen]
    pub fn add_root(&mut self, re: f32, im: f32) {
        self.roots.push(Complex32 { re, im });
    }

    #[wasm_bindgen]
    pub fn get_closest_root_id(&self, re: f32, im: f32) -> JsValue {
        let mut min_d = f32::MAX;
        let mut idx = u32::MAX;

        let p = Complex32::new(re, im);
        for (i, root) in self.roots.iter().enumerate() {
            let d = p - root;
            let d = (d.re * d.re + d.im * d.im).sqrt();
            if d < min_d {
                min_d = d;
                idx = i as u32;
            }
        }

        if idx as usize > self.roots.len() {
            return JsValue::from_serde(&(-1.0, u32::MAX)).unwrap();
        }
        JsValue::from_serde(&(idx, min_d)).unwrap()
    }

    #[wasm_bindgen]
    pub fn remove_root_by_id(&mut self, id: usize) {
        if id > self.roots.len() {
            return;
        }
        self.roots.remove(id);
    }

    #[wasm_bindgen]
    pub fn set_root_by_id(&mut self, id: usize, re: f32, im: f32) {
        if id > self.roots.len() {
            return;
        }
        self.roots[id] = Complex32::new(re, im);
    }
}

impl Polynomial {
    pub fn get_roots(&self) -> &[Complex32] {
        &self.roots
    }

    pub fn calculate(&self, z: Complex32) -> Option<Complex32> {
        let mut prod = match self.roots.get(0) {
            Some(v) => z - v,
            None => return None,
        };
        for root in self.roots.iter().skip(1) {
            prod *= z - root;
        }
        Some(prod)
    }

    pub fn derivative(&self, z: Complex32) -> Option<Complex32> {
        let (mut prod, mut sum) = match self.roots.get(0) {
            Some(v) => (z - v, 1.0 / (z - v)),
            None => return None,
        };
        for root in self.roots.iter().skip(1) {
            prod *= z - root;
            sum += 1.0 / (z - root);
        }
        Some(prod * sum)
    }

    pub fn newton_method_approx(&self, z: Complex32) -> Complex32 {
        let mut sum = Complex32::new(0.0, 0.0);
        for root in self.roots.iter() {
            sum += 1.0 / (z - root);
            if sum.is_nan() {
                return root.clone();
            }
        }
        z - 1.0 / sum
    }

    #[target_feature(enable = "simd128")]
    pub unsafe fn simd_newton_method_approx_for_two_numbers(&self, two_z: v128) -> v128 {
        // let first: (i32, i32) = transmute(*(std::ptr::addr_of!(two_z) as *const u64));
        // let second: (i32, i32) = transmute(*((std::ptr::addr_of!(two_z) as *const u64).offset(1)));
        // log!(
        //     "two_z: {:?}, first: {:?}, second: {:?}",
        //     two_z,
        //     first,
        //     second
        // );
        let _res = u64x2(
            self.simd_newton_method_approx(*(std::ptr::addr_of!(two_z) as *const u64)),
            self.simd_newton_method_approx(*((std::ptr::addr_of!(two_z) as *const u64).offset(1))),
        );
        // log!("_res: {:?}", _res);
        _res
    }

    // #[inline]
    #[target_feature(enable = "simd128")]
    pub fn simd_newton_method_approx(&self, z: u64) -> u64 {
        // In scalar implementation we process only one root at a time.
        // In simd implementation we process two roots at the same time.
        // We have f32x4 [A, B, C, D], in which (A, B): re and im parts
        // of first complex value and (C, D): re and im parts of second
        // complex value. To get single complex value we need to sum
        // (A + C, B + D)

        let mut _sum = f32x4_splat(0.0);
        let _z = unsafe { v128_load64_splat(std::ptr::addr_of!(z) as *const u64) };
        let roots_chunks_iter = self.roots.chunks_exact(2);
        let rem = roots_chunks_iter.remainder();
        for roots_chunk in roots_chunks_iter {
            unsafe {
                // General formula: sum += 1.0 / (z - root)
                // 1. Subtraction (z - root)
                let _diff = f32x4_sub(_z, *(roots_chunk.as_ptr() as *const v128));

                // 1*. Check if difference == 0 <=> z == one of roots
                let _diff_eq = f64x2_eq(_diff, SimdHelper::F64_ZEROES);
                if v128_any_true(_diff_eq) {
                    let root_check: i32 = i32x4_extract_lane::<0>(_diff_eq);
                    // If z == first root
                    if root_check == -1 {
                        return *(std::ptr::addr_of!(roots_chunk[0]) as *const u64);
                    }
                    // If z == second root
                    return *(std::ptr::addr_of!(roots_chunk[1]) as *const u64);
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
                let _diff = f32x4_sub(_z, v128_load64_zero(std::ptr::addr_of!(*rem) as *const u64));
                let _diff_eq = f64x2_eq(_diff, SimdHelper::F64_ZEROES);
                if v128_any_true(_diff_eq) {
                    return *(rem as *const _ as *const u64);
                }
                let _inversion = SimdHelper::complex_number_inversion(_diff);

                _sum = f32x4_add(_sum, _inversion);
            }
        }

        // This gives fancy effect (due to swapped sum indexes):
        // let sum = Complex32::new(
        //     f32x4_extract_lane::<0>(_sum) + f32x4_extract_lane::<1>(_sum),
        //     f32x4_extract_lane::<2>(_sum) + f32x4_extract_lane::<3>(_sum),
        // );

        // Sum first and second complex values
        _sum = f32x4_add(_sum, _sum_shift);

        // Return value: z - 1.0 / sum
        unsafe {
            let _inversion = SimdHelper::complex_number_inversion(_sum);
            let _sub = f32x4_sub(_z, _inversion);
            *(std::ptr::addr_of!(_sub) as *const u64)
        }
    }
}
