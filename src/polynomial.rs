use num_complex::Complex64;
use wasm_bindgen::prelude::*;

use super::logger::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct Polynomial {
    roots: Vec<Complex64>,
}

#[wasm_bindgen]
impl Polynomial {
    #[wasm_bindgen(constructor)]
    pub fn new(roots: &JsValue) -> Option<Polynomial> {
        let roots: Vec<(f64, f64)> = match roots.into_serde() {
            Ok(v) => v,
            Err(_) => {
                log!("Error getting roots from: {:?}", roots);
                return None;
            }
        };
        log!("Got roots: {:?}", roots);
        Some(Polynomial {
            roots: roots
                .iter()
                .map(|(re, im)| Complex64 { re: *re, im: *im })
                .collect(),
        })
    }

    #[wasm_bindgen]
    pub fn add_root(&mut self, re: f64, im: f64) {
        log!("x: {}, y: {}", re, im);
        self.roots.push(Complex64 { re, im });
        log!("Now have {} roots: {:?}", self.roots.len(), self.roots);
    }

    #[wasm_bindgen]
    pub fn get_closest_root_id(&self, re: f64, im: f64) -> Option<u32> {
        let mut min_d = f64::MAX;
        let mut idx = usize::MAX;

        let p = Complex64::new(re, im);
        for (i, root) in self.roots.iter().enumerate() {
            let d = p - root;
            let d = (d.re * d.re + d.im * d.im).sqrt();
            if d < min_d {
                min_d = d;
                idx = i;
            }
        }

        if idx > self.roots.len() {
            return None;
        }
        Some(idx as u32)
    }

    #[wasm_bindgen]
    pub fn remove_root_by_id(&mut self, id: usize) {
        if id > self.roots.len() {
            return;
        }
        self.roots.remove(id);
    }
}

impl Polynomial {
    pub fn get_roots(&self) -> &[Complex64] {
        &self.roots
    }

    pub fn calculate(&self, z: Complex64) -> Option<Complex64> {
        let mut prod = match self.roots.get(0) {
            Some(v) => z - v,
            None => return None,
        };
        // log!("z: {}\nInitial prod: {}", z, &prod);
        for root in self.roots.iter().skip(1) {
            let k = z - root;
            prod *= k;
            // log!("Root: {}\nk: {}\nProd: {}", root, k, &prod);
        }
        Some(prod)
    }

    pub fn derivative(&self, z: Complex64) -> Option<Complex64> {
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

    pub fn newton_method_approx(&self, z: Complex64) -> Option<Complex64> {
        let mut sum = Complex64::new(0.0, 0.0);
        for root in self.roots.iter() {
            sum += 1.0 / (z - root);
            if sum.is_nan() {
                return Some(root.clone());
            }
        }
        Some(z - 1.0 / sum)
    }
}
