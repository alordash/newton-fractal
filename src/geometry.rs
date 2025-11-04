use serde::{Deserialize, Serialize};

use std::arch::wasm32::*;
use std::ptr::addr_of;

#[repr(C)]
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

pub fn transform_point_to_canvas_scale(x: f32, y: f32, plot_scale: &PlotScale) -> (f32, f32) {
    (
        ((x - plot_scale.x_offset) * plot_scale.x_display_range / plot_scale.x_value_range),
        ((y - plot_scale.y_offset) * plot_scale.y_display_range / plot_scale.y_value_range),
    )
}

// Formula:
// x = x_offset + x * x_value_range / width
// y = y_offset + y * y_value_range / height
#[target_feature(enable = "simd128")]
pub fn simd_transform_point_to_plot_scale(_points: v128, plot_scale: &PlotScale) -> v128 {
    // Note: because parameters in PlotScale are arranged
    // linearly in memory, we can use pointer to x-related
    // params to extract simultaneously both x- and y-related
    // params. To do this, the pointer is cast to u64.
    unsafe {
        // For short x_value_range = xr, y_value_range = yr
        // _ranges = [xr, yr, xr, yr]
        let _ranges = v128_load64_splat(addr_of!(plot_scale.x_value_range) as *const u64);

        // _sizes = [width, height, width, height]
        let _sizes = v128_load64_splat(addr_of!(plot_scale.x_display_range) as *const u64);

        // For short x_offset = xo, y_offset = yo
        // _offsets = [xo, yo, xo, yo]
        let _offsets = v128_load64_splat(addr_of!(plot_scale.x_offset) as *const u64);

        // x * x_value_range
        // [x1 * xr, y1 * yr, x2 * xr, y2 * yr]
        let _mul = f32x4_mul(_points, _ranges);

        // x * x_value_range / width
        // [
        //     x1 * xr / width,
        //     y1 * yr / height,
        //     x2 * xr / width,
        //     y2 * yr / height
        // ]
        let _div = f32x4_div(_mul, _sizes);

        // x_offset + x * x_value_range / width
        // [
        //     xo + x1 * xr / width,
        //     yo + y1 * yr / height,
        //     xo + x2 * xr / width,
        //     yo + y2 * yr / height
        // ]
        f32x4_add(_div, _offsets)
    }
}
