// Using Newton's method
use num_complex::Complex64;
use wasm_bindgen::prelude::*;

use crate::polynomial::Polynomial;

#[wasm_bindgen]
pub struct Approximation {
    points: Vec<Complex64>,
}

#[wasm_bindgen]
impl Approximation {
    #[wasm_bindgen(constructor)]
    pub fn new(x: Option<f64>, y: Option<f64>) -> Approximation {
        let mut points: Vec<Complex64> = vec![];
        if let (Some(x), Some(y)) = (x, y) {
            points.push(Complex64::new(x, y));
        }
        Approximation { points }
    }

    #[wasm_bindgen]
    pub fn get_next_point(&mut self, polynom: &Polynomial) {
        let len = self.points.len();
        if len == 0 {
            return;
        }
        match polynom.newton_method_approx(self.points[len - 1]) {
            Some(v) => self.points.push(v),
            None => (),
        }
    }
}

impl Approximation {
    pub fn get_points(&self) -> &[Complex64] {
        &self.points
    }
}
