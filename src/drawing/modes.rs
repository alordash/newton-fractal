use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use std::fmt::{self, Debug, Formatter};

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum DrawingModes {
    CpuWasmSimd,
    CpuWasmScalar,
    CpuJsScalar,
}

impl Debug for DrawingModes {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.write_str(match &self {
            DrawingModes::CpuWasmSimd => "CPU-wasm-simd",
            DrawingModes::CpuWasmScalar => "CPU-wasm-scalar",
            DrawingModes::CpuJsScalar => "CPU-js-scalar",
        })
    }
}