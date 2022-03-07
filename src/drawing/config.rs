use crate::plotting::PlotScale;

use std::{
    mem::{transmute, transmute_copy},
    ptr::addr_of,
};

use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use super::modes::DrawingModes;

#[wasm_bindgen]
#[repr(C)]
#[derive(Debug)]
pub struct DrawingConfig {
    #[wasm_bindgen(skip)]
    pub drawing_mode: DrawingModes,
    #[wasm_bindgen(skip)]
    pub plot_scale: PlotScale,
    #[wasm_bindgen(skip)]
    pub roots: Vec<Complex32>,
    #[wasm_bindgen(skip)]
    pub iterations_count: usize,
    #[wasm_bindgen(skip)]
    pub colors: Vec<[u8; 4]>,
    pub part_offset: Option<usize>,
    pub parts_count: Option<usize>,
}

#[wasm_bindgen]
impl DrawingConfig {
    #[wasm_bindgen(constructor)]
    pub fn new(
        drawing_mode: u8,
        plot_scale: &PlotScale,
        mut roots: Vec<f32>,
        iterations_count: usize,
        mut colors: Vec<u8>,
        part_offset: Option<usize>,
        parts_count: Option<usize>,
    ) -> Option<DrawingConfig> {
        roots.shrink_to_fit();
        colors.shrink_to_fit();

        if roots.len() % 2 != 0 || colors.len() % 4 != 0 {
            return None;
        }

        let roots_result_len = roots.len() / 2;
        let roots_packed: Vec<Complex32> = unsafe {
            Vec::from_raw_parts(
                roots.as_mut_ptr() as *mut Complex32,
                roots_result_len,
                roots_result_len,
            )
        };
        std::mem::forget(roots);

        let region_colors_result_len = colors.len() / 4;
        let colors_packed: Vec<[u8; 4]> = unsafe {
            Vec::from_raw_parts(
                colors.as_mut_ptr() as *mut [u8; 4],
                region_colors_result_len,
                region_colors_result_len,
            )
        };
        std::mem::forget(colors);

        let drawing_config = DrawingConfig {
            drawing_mode: unsafe { transmute_copy(&drawing_mode) },
            plot_scale: *plot_scale,
            roots: roots_packed,
            iterations_count,
            colors: colors_packed,
            part_offset,
            parts_count,
        };

        return Some(drawing_config);
    }
}
