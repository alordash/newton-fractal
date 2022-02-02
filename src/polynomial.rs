use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use std::arch::wasm32::*;
use std::mem::transmute;

use crate::simd_constants::SimdConstants;

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
        for roots in self.roots.chunks_exact(2) {
            for root in roots {
                sum += 1.0 / (z - root);
                if sum.is_nan() {
                    return root.clone();
                }
            }
        }
        z - 1.0 / sum
    }

    #[inline]
    #[target_feature(enable = "simd128")]
    pub fn simd_newton_method_approx(&self, z: Complex32) -> Complex32 {
        let mut _sum = f32x4_splat(0.0);
        let _z = unsafe { v128_load64_splat(([z.re, z.im]).as_ptr() as *const u64) };
        for roots_chunk in self.roots.chunks_exact(2) {
            // 1. subtract
            let _roots = unsafe { v128_load(roots_chunk.as_ptr() as *const v128) };

            let _diff = f32x4_sub(_z, _roots);
            let _diff_eq = f64x2_eq(_diff, SimdConstants::F64_ZEROES);
            if v128_any_true(_diff_eq) {
                let root_check: i32 = i32x4_extract_lane::<0>(_diff_eq);
                if root_check == -1 {
                    return roots_chunk[0];
                }
                return roots_chunk[1];
            }

            // 2. inversion
            let _numerator = f32x4_mul(_diff, SimdConstants::INVERSION_NEG_MASK);
            let _squares = f32x4_mul(_diff, _diff);
            let _shifted_squares = i32x4_shuffle::<1, 0, 3, 2>(_squares, _squares);
            let _denumerator = f32x4_add(_squares, _shifted_squares);

            let _inversion = f32x4_div(_numerator, _denumerator);
            // 3. add
            _sum = f32x4_add(_sum, _inversion);
        }

        let sum = Complex32::new(
            f32x4_extract_lane::<0>(_sum) + f32x4_extract_lane::<1>(_sum),
            f32x4_extract_lane::<2>(_sum) + f32x4_extract_lane::<3>(_sum),
        );
        z - 1.0 / sum
    }
}
