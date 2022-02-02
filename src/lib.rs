#![cfg(target_arch = "wasm32")]
use std::{arch::wasm32::*, intrinsics::transmute};

use num_complex::Complex32;
use wasm_bindgen::prelude::*;

#[macro_use]
mod logger;
use logger::*;

pub mod simd_complex32;
use core::arch::wasm32::*;

pub mod polynomial;
use polynomial::Polynomial;

pub mod plotting;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("Test: {}", "log");
    Ok(())
}

const X_MAX: f32 = 1000.0;
const Y_MAX: f32 = 1000.0;
const X_STEP: f32 = 0.001;
const Y_STEP: f32 = 0.001;

const ITERATIONS_COUNT: usize = 11;

#[wasm_bindgen]
#[target_feature(enable = "simd128")]
pub fn newton_method_test(polynom: &Polynomial) {
    let mut x = 0.0;
    let mut y = 0.0;
    let mut sum = Complex32::new(0.0, 0.0);

    while y < Y_MAX {
        while x < X_MAX {
            let mut p = Complex32::new(x, y);
            for _ in 0..ITERATIONS_COUNT {
                p = polynom.newton_method_approx(p);
            }
            sum += p;
            x += X_STEP;
        }
        y += Y_STEP;
    }

    log!("sum = {:?}", sum);
}

#[wasm_bindgen]
#[target_feature(enable = "simd128")]
pub fn simd_newton_method_test(polynom: &Polynomial) {
    let mut x = 0.0;
    let mut y = 0.0;
    let mut sum = Complex32::new(0.0, 0.0);

    while y < Y_MAX {
        while x < X_MAX {
            let mut p = Complex32::new(x, y);
            for _ in 0..ITERATIONS_COUNT {
                p = polynom.simd_newton_method_approx(p);
            }
            // if p.is_nan() {
            //     log!("nan p at ({}, {}): {:?}", x, y, p);
            // }
            sum += p;
            x += X_STEP;
        }
        y += Y_STEP;
    }

    log!("sum = {:?}", sum);
}
