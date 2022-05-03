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

    let (part_offset, parts_count) = (
        part_offset.or(Some(0)).unwrap(),
        parts_count.or(Some(1)).unwrap(),
    );

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
    ((total_size * offset) as f32 / (parts_count * step) as f32).floor() as usize * step
}

pub fn fill_pixels_scalar(
    plot_scale: &PlotScale,
    roots: &[Complex32],
    iterations_count: usize,
    colors: &[u32],
    buffer_ptr: *mut u32,
    part_offset: usize,
    parts_count: usize,
) {
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
    part_offset: usize,
    parts_count: usize,
) {
    let PlotScale {
        x_display_range: width,
        y_display_range: height,
        ..
    } = *plot_scale;
    let (w_int, h_int) = (width as usize, height as usize);

    let total_size = w_int * h_int;
    let this_border = calculate_part_size(total_size, parts_count, part_offset, 4) / 4;
    let next_border = calculate_part_size(total_size, parts_count, part_offset + 1, 4) / 4;

    let _width = f32x4_splat(width);

    unsafe {
        for i in this_border..next_border {
            let mut _i = f32x4_splat((4 * i) as f32);
            _i = f32x4_add(_i, f32x4(0.0, 1.0, 2.0, 3.0));
            let _xs = SimdMath::f32x4_mod(_i, _width);
            let _ys = f32x4_floor(f32x4_div(_i, _width));

            let (id0, id1, id2, id3) =
                simd_get_root_id(_xs, _ys, roots, iterations_count, &plot_scale);

            *(buffer_ptr.add(i)) = transmute([colors[id0], colors[id1], colors[id2], colors[id3]]);
        }
        // Filling unfit pixels at the end
        if part_offset == parts_count - 1 {
            let unfit_pixels_begin = 4 * next_border;
            let buffer_as_u32_ptr = buffer_ptr as *mut u32;
            for i in unfit_pixels_begin..total_size {
                let (x, y) = transform_point_to_plot_scale(
                    (i % w_int) as f32,
                    (i / w_int) as f32,
                    &plot_scale,
                );
                *buffer_as_u32_ptr.add(i) = colors[get_root_id(Complex32::new(x, y), roots, iterations_count)];
            }
        }
    }
}
