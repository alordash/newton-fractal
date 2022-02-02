use num_complex::{Complex32};
use wasm_bindgen::prelude::*;

use std::arch::wasm32::*;
use std::mem::transmute;

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
}
