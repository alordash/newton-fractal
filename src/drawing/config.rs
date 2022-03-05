use crate::plotting::PlotScale;

use std::mem::transmute;

use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use super::modes::DrawingModes;

#[wasm_bindgen]
#[derive(Debug)]
pub struct DrawingConfig {
    drawing_mode: DrawingModes,
    plot_scale: PlotScale,
    roots: Vec<Complex32>,
    iterations_count: usize,
    region_colors: Vec<[u8; 4]>,
}

#[wasm_bindgen]
impl DrawingConfig {
    #[wasm_bindgen(constructor)]
    pub fn new(
        drawing_mode: DrawingModes,
        plot_scale: &PlotScale,
        roots: Vec<f32>,
        iterations_count: usize,
        region_colors: Vec<u8>,
    ) -> Option<DrawingConfig> {
        if roots.len() % 2 != 0 || region_colors.len() % 4 != 0 {
            return None;
        }
        let roots: Vec<Complex32> = unsafe { transmute(roots) };
        let region_colors: Vec<[u8; 4]> = unsafe { transmute(region_colors) };
        log!("RUST: new drawing_mode: {:?}", drawing_mode);
        return Some(DrawingConfig {
            drawing_mode,
            plot_scale: *plot_scale,
            roots,
            iterations_count,
            region_colors,
        });
    }
}
