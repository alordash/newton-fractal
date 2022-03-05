use super::worker::DrawingModes;
use crate::plotting::PlotScale;

use std::mem::transmute;

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct Complex32 {
    re: f32,
    im: f32,
}

impl Into<num_complex::Complex32> for Complex32 {
    fn into(self) -> num_complex::Complex32 {
        unsafe { transmute(self) }
    }
}

#[wasm_bindgen(typescript_custom_section)]
const TS_DRAWING_CONFIG_TYPE: &'static str = r#"
export interface IDrawingConfig { 
    "drawing_mode": DrawingModes,
    "plot_scale": PlotScale,
    "roots": Array<{re: number, im: number}>,
    "iterations_count": number,
    "region_colors": Uint32Array
}; 
"#;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = "IDrawingConfig")]
    pub type IDrawingConfig;
}

#[derive(Serialize, Deserialize)]
pub struct DrawingConfig {
    pub drawing_mode: DrawingModes,
    pub plot_scale: PlotScale,
    pub roots: Vec<Complex32>,
    pub iterations_count: usize,
    pub region_colors: Vec<u32>,
}

impl From<IDrawingConfig> for DrawingConfig {
    fn from(drawing_config: IDrawingConfig) -> DrawingConfig {
        drawing_config.obj.into_serde().unwrap()
    }
}

impl Into<IDrawingConfig> for DrawingConfig {
    fn into(self) -> IDrawingConfig {
        IDrawingConfig {
            obj: JsValue::from_serde(&self).unwrap(),
        }
    }
}