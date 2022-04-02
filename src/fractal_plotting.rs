use crate::{fractal_calculation::*, geometry::*, simd_math::SimdMath};

use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use std::arch::wasm32::*;
use std::mem::{transmute, ManuallyDrop};
use std::ptr::addr_of;
use std::slice;

#[repr(u8)]
#[wasm_bindgen]
pub enum DrawingModes {
    Simd,
    Scalar,
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
pub struct ColorsPack(u32, u32, u32, u32);

pub fn convert_colors_array<'a>(colors: &Vec<[u8; 4]>) -> &'a [u32] {
    let colors = ManuallyDrop::new(colors);
    unsafe { slice::from_raw_parts(addr_of!(colors[0]) as *mut u32, colors.len()) }
}

#[wasm_bindgen]
pub fn fill_pixels_wasm(
    drawing_mode: DrawingModes,
    plot_scale: JsValue, // PlotScale
    roots: JsValue,      // Vec<[f32; 2]>
    iterations_count: usize,
    colors: JsValue,
    buffer_ptr: u32,
    part_offset: Option<usize>,
    parts_count: Option<usize>,
) {
    let plot_scale: PlotScale = plot_scale.into_serde().unwrap();
    let roots: Vec<Complex32> = (roots.into_serde::<Vec<(f32, f32)>>().unwrap())
        .into_iter()
        .map(|p| Complex32 { re: p.0, im: p.1 })
        .collect();

    let colors: Vec<[u8; 4]> = colors.into_serde().unwrap();
    let colors = convert_colors_array(&colors);

    match drawing_mode {
        DrawingModes::Scalar => fill_pixels_scalar(
            &plot_scale,
            roots.as_slice(),
            iterations_count,
            colors,
            buffer_ptr as *mut u32,
            part_offset,
            parts_count,
        ),
        DrawingModes::Simd => fill_pixels_simd(
            &plot_scale,
            roots.as_slice(),
            iterations_count,
            colors,
            buffer_ptr as *mut ColorsPack,
            part_offset,
            parts_count,
        ),
    };
}

pub fn calculate_part_size(
    total_size: usize,
    parts_count: usize,
    offset: usize,
    step: usize,
) -> usize {
    ((total_size * offset) as f32 / (parts_count * step) as f32).round() as usize * step
}

pub fn fill_pixels_scalar(
    plot_scale: &PlotScale,
    roots: &[Complex32],
    iterations_count: usize,
    colors: &[u32],
    buffer_ptr: *mut u32,
    part_offset: Option<usize>,
    parts_count: Option<usize>,
) {
    let (part_offset, parts_count) = (
        part_offset.or(Some(0)).unwrap(),
        parts_count.or(Some(1)).unwrap(),
    );

    let PlotScale {
        x_display_range: width,
        y_display_range: height,
        ..
    } = *plot_scale;
    let (w_int, h_int) = (width as usize, height as usize);

    let total_size = w_int * h_int;
    let this_border = calculate_part_size(total_size, parts_count, part_offset, 1);
    let next_border = calculate_part_size(total_size, parts_count, part_offset + 1, 1);

    unsafe {
        for i in this_border..next_border {
            let (x, y) =
                transform_point_to_plot_scale((i % w_int) as f32, (i / w_int) as f32, &plot_scale);
            *buffer_ptr.add(i) = colors[get_root_id(Complex32::new(x, y), roots, iterations_count)];
        }
    }
}

#[target_feature(enable = "simd128")]
pub fn fill_pixels_simd(
    plot_scale: &PlotScale,
    roots: &[Complex32],
    iterations_count: usize,
    colors: &[u32],
    buffer_ptr: *mut ColorsPack,
    part_offset: Option<usize>,
    parts_count: Option<usize>,
) {
    let (part_offset, parts_count) = (
        part_offset.or(Some(0)).unwrap(),
        parts_count.or(Some(1)).unwrap(),
    );

    let PlotScale {
        x_display_range: width,
        y_display_range: height,
        ..
    } = *plot_scale;
    let (w_int, h_int) = (width as usize, height as usize);

    let filler = |x: usize, y: usize| {
        let mut _min_distances = f32x4(f32::MAX, f32::MAX, f32::MAX, f32::MAX);
        let mut _closest_root_ids = i32x4(0, 0, 0, 0);
        // Simd can be used here
        let (x, y) = (4.0 * x as f32, y as f32);
        let mut _points1 = simd_transform_point_to_plot_scale(x + 0.0, y, x + 1.0, y, &plot_scale);
        let mut _points2 = simd_transform_point_to_plot_scale(x + 2.0, y, x + 3.0, y, &plot_scale);
        for _ in 0..iterations_count {
            unsafe {
                _points1 = simd_newton_method_approx_for_two_numbers(_points1, &roots);
                _points2 = simd_newton_method_approx_for_two_numbers(_points2, &roots);
            }
        }
        unsafe {
            for (i, &root) in roots.iter().enumerate() {
                let _ids = i32x4_splat(i as i32);
                let _root = v128_load64_splat(addr_of!(root) as *const u64);
                let _sqrt1 = SimdMath::calculate_distance(_points1, _root);
                let _sqrt2 = SimdMath::calculate_distance(_points2, _root);
                let _distance = i32x4_shuffle::<0, 2, 4, 6>(_sqrt1, _sqrt2);
                let _le_check = f32x4_lt(_distance, _min_distances);
                _min_distances = f32x4_pmin(_distance, _min_distances);
                _closest_root_ids = v128_bitselect(_ids, _closest_root_ids, _le_check);
            }
        }
        unsafe {
            let (id1, id2, id3, id4): (usize, usize, usize, usize) = transmute(_closest_root_ids);
            transmute([colors[id1], colors[id2], colors[id3], colors[id4]])
        }
    };

    let total_size = w_int * h_int;
    let this_border = calculate_part_size(total_size, parts_count, part_offset, 4) / 4;
    let next_border = calculate_part_size(total_size, parts_count, part_offset + 1, 4) / 4;

    let w_int = w_int / 4;
    unsafe {
        for i in this_border..next_border {
            *buffer_ptr.add(i) = filler(i % w_int, i / w_int);
        }
    }
}
