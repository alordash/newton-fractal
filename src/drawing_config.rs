use crate::plotting::PlotScale;

use std::ptr::addr_of;

use num_complex::Complex32;
use std::{borrow::Borrow, mem, ops::Deref};
use wasm_bindgen::{prelude::*, Clamped};

use js_sys::{Object, Reflect, Uint8ClampedArray};
use wasm_bindgen::{prelude::*, JsCast};
use web_sys::{
    DedicatedWorkerGlobalScope, EventTarget, ImageData, MessageEvent, Worker, WorkerGlobalScope,
};

use std::slice;

use crate::plotting::{fill_pixels, fill_pixels_simd};

use wasm_bindgen::__rt::WasmRefCell;

#[wasm_bindgen]
#[repr(C)]
#[derive(Debug)]
pub struct DrawingConfig {
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

#[wasm_bindgen]
pub fn fill_pixels_parallel(ptr: u32) -> Clamped<Vec<u8>> {
    let mut wasm_ref_cell = unsafe { Box::from_raw(ptr as *mut WasmRefCell<DrawingConfig>) };
    let drawing_config = wasm_ref_cell.get_mut();
    let drawing_config_ptr = addr_of!(*drawing_config);
    // log!("drawing_config: {:?}", drawing_config);
    let DrawingConfig {
        plot_scale,
        roots,
        iterations_count,
        colors,
        part_offset,
        parts_count,
    } = drawing_config;

    // log!(
    //     "Worker #{offset} got message (offset: {offset}, count: {count})",
    //     offset = part_offset.or(Some(usize::MAX)).unwrap(),
    //     count = parts_count.or(Some(1)).unwrap()
    // );

    let colors_packed =
        unsafe { slice::from_raw_parts_mut(addr_of!(colors[0]) as *mut u32, colors.len()) };

    let data = fill_pixels(
        plot_scale,
        roots,
        *iterations_count,
        colors_packed,
        *part_offset,
        *parts_count,
        None
    );

    // log!("Calculated, first 10 items of data: {:?}", &data[0..10]);

    data
}
