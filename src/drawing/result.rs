use super::modes::DrawingModes;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct DrawingResult {
    pub drawing_mode: DrawingModes,
    pub elapsed_ms: usize,
    pub data: Vec<u8>,
}
