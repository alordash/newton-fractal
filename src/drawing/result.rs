use super::worker::DrawingModes;

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[wasm_bindgen(typescript_custom_section)]
const TS_DRAWING_RESULT_TYPE: &'static str = r#"
export interface IDrawingResult { 
    "drawing_mode": DrawingModes,
    "elapsed_ms": number,
    "data": Uint8ClampedArray,
}; 
"#;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = "IDrawingResult")]
    pub type IDrawingResult;
}

#[derive(Serialize, Deserialize)]
pub struct DrawingResult {
    pub drawing_mode: DrawingModes,
    pub elapsed_ms: usize,
    pub data: Vec<u8>,
}

impl Into<IDrawingResult> for DrawingResult {
    fn into(self) -> IDrawingResult {
        IDrawingResult {
            obj: JsValue::from_serde(&self).unwrap(),
        }
    }
}

#[wasm_bindgen]
pub fn test_drawing_result() -> IDrawingResult {
    // let DrawingConfig { drawing_mode, plot_scale, roots, iterations_count, region_colors } = drawing_config.into();
    // let draw_result = fill_pixels(plot_scale, roots, iterations_count, region_colors, None, None);
    let drawing_result = DrawingResult {
        drawing_mode: DrawingModes::CPU_WASM_SCALAR,
        elapsed_ms: 1000,
        data: vec![1u8, 2, 3, 4, 5, 6, 7, 8]
    };
    drawing_result.into()
}