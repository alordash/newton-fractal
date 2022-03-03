use crate::{newtons_fractal::*, simd_constants::SimdHelper};

use num_complex::Complex32;
use serde::{Deserialize, Serialize};
use wasm_bindgen::{prelude::*, Clamped};
use web_sys::ImageData;

use std::arch::wasm32::*;
use std::mem::transmute;
use std::ptr::addr_of;

use super::logger::*;

#[repr(C)]
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
struct ColorsPack(u32, u32, u32, u32);

pub fn convert_colors_array(colors: JsValue) -> Vec<u32> {
    unsafe { transmute(colors.into_serde::<Vec<[u8; 4]>>().unwrap()) }
}

#[derive(Serialize, Deserialize)]
pub struct PlotScale {
    x_offset: f32,
    y_offset: f32,
    x_value_range: f32,
    y_value_range: f32,
    x_display_range: f32,
    y_display_range: f32,
}

pub fn transform_point_to_plot_scale(x: f32, y: f32, plot_scale: &PlotScale) -> (f32, f32) {
    (
        plot_scale.x_offset + x * plot_scale.x_value_range / plot_scale.x_display_range,
        plot_scale.y_offset + y * plot_scale.y_value_range / plot_scale.y_display_range,
    )
}

#[target_feature(enable = "simd128")]
pub fn simd_transform_point_to_plot_scale(
    x1: f32,
    y1: f32,
    x2: f32,
    y2: f32,
    plot_scale: &PlotScale,
) -> v128 {
    // Formula:
    // x = x_offset + x * x_range / width
    // y = y_offset + y * y_range / height
    unsafe {
        let _source_points = f32x4(x1, y1, x2, y2);
        // _ranges = [x_range, y_range, x_range, y_range]
        let _ranges = v128_load64_splat(addr_of!(plot_scale.x_value_range) as *const u64);
        // _sizes = [width, height, width, height]
        let _sizes = v128_load64_splat(addr_of!(plot_scale.x_display_range) as *const u64);
        // _offsets = [x_offset, y_offset, x_offset, y_offset]
        let _offsets = v128_load64_splat(addr_of!(plot_scale.x_offset) as *const u64);
        let _mul = f32x4_mul(_source_points, _ranges);
        let _div = f32x4_div(_mul, _sizes);
        f32x4_add(_div, _offsets)
    }
}

pub fn transform_point_to_canvas_scale(x: f32, y: f32, plot_scale: &PlotScale) -> (f32, f32) {
    (
        ((x - plot_scale.x_offset) * plot_scale.x_display_range / plot_scale.x_value_range),
        ((y - plot_scale.y_offset) * plot_scale.y_display_range / plot_scale.y_value_range),
    )
}

#[wasm_bindgen]
pub fn fill_pixels(
    plot_scale: JsValue, // PlotScale
    roots: JsValue,      // Vec<Complexf32>
    iterations_count: usize,
    colors: JsValue,
    part_offset: Option<usize>,
    parts_count: Option<usize>,
) -> Clamped<Vec<u8>> {
    let plot_scale: PlotScale = plot_scale.into_serde().unwrap();
    let roots: Vec<Complex32> = (roots.into_serde::<Vec<(f32, f32)>>().unwrap())
        .into_iter()
        .map(|p| Complex32 { re: p.0, im: p.1 })
        .collect();
    let colors = convert_colors_array(colors);
    let (part_offset, parts_count) = (
        part_offset.or(Some(0)).unwrap(),
        parts_count.or(Some(1)).unwrap(),
    );

    let PlotScale {
        x_display_range: width,
        y_display_range: height,
        ..
    } = plot_scale;
    let (w_int, h_int) = (width as usize, height as usize);

    let filler = |x: usize, y: usize| {
        let mut min_d = f32::MAX;
        let mut closest_root_id: usize = 0;
        let (xp, yp) = transform_point_to_plot_scale(x as f32, y as f32, &plot_scale);
        let mut z = Complex32::new(xp, yp);
        for _ in 0..iterations_count {
            let (id, new_point) = newton_method_approx(z, &roots);
            if (id & (1 << 31)) == 0 {
                return colors[id];
            }
            z = new_point;
        }

        for (i, root) in roots.iter().enumerate() {
            let d = (z - root).norm_sqr().sqrt();
            if d < min_d {
                min_d = d;
                closest_root_id = i;
            }
        }
        colors[closest_root_id]
    };

    let size = w_int * h_int;
    let this_border = ((size * part_offset) as f32 / parts_count as f32).round() as usize;
    let next_border = ((size * (part_offset + 1)) as f32 / parts_count as f32).round() as usize;
    let size = next_border - this_border;

    let mut pixels_data: Vec<u32> = vec![0u32; size];
    unsafe {
        for i in this_border..next_border {
            *pixels_data.get_unchecked_mut(i - this_border) = filler(i % w_int, i / w_int);
        }
    }

    let pixels_data: &[u8] = unsafe {
        std::slice::from_raw_parts(
            std::mem::transmute(pixels_data.as_ptr()),
            pixels_data.len() * 4,
        )
    };

    Clamped(pixels_data.to_vec())
}

#[wasm_bindgen]
#[target_feature(enable = "simd128")]
pub fn fill_pixels_simd(
    plot_scale: JsValue, // PlotScale
    roots: JsValue,      // Vec<Complexf32>
    iterations_count: usize,
    colors: JsValue,
) -> Clamped<Vec<u8>> {
    let plot_scale: PlotScale = plot_scale.into_serde().unwrap();
    let roots: Vec<Complex32> = (roots.into_serde::<Vec<(f32, f32)>>().unwrap())
        .into_iter()
        .map(|p| Complex32 { re: p.0, im: p.1 })
        .collect();
    let colors = convert_colors_array(colors);

    let PlotScale {
        x_display_range: width,
        y_display_range: height,
        ..
    } = plot_scale;
    let (w_int, h_int) = (width as usize / 4, height as usize);

    let filler = |x, y| {
        let mut _min_distances = SimdHelper::F32_MAXIMUMS;
        let mut _closest_root_ids = SimdHelper::I32_ZEROES;
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
                let _sqrt1 = SimdHelper::calculate_distance(_points1, _root);
                let _sqrt2 = SimdHelper::calculate_distance(_points2, _root);
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

    let mut pixels_data: Vec<ColorsPack> = vec![ColorsPack(0, 0, 0, 0); w_int * h_int];
    unsafe {
        for j in 0..h_int {
            for i in 0..w_int {
                *pixels_data.get_unchecked_mut(i + j * w_int) = filler(i, j);
            }
        }
    }

    let pixels_data: &[u8] = unsafe {
        std::slice::from_raw_parts(
            std::mem::transmute(pixels_data.as_ptr()),
            pixels_data.len() * 16,
        )
    };

    Clamped(pixels_data.to_vec())
}
