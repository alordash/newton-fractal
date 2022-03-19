use serde::{Deserialize, Serialize};


use std::arch::wasm32::*;
use std::ptr::addr_of;

use super::logging::*;

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub struct PlotScale {
    pub x_offset: f32,
    pub y_offset: f32,
    pub x_value_range: f32,
    pub y_value_range: f32,
    pub x_display_range: f32,
    pub y_display_range: f32,
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