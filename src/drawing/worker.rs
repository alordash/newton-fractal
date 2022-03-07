use std::{borrow::Borrow, intrinsics::transmute, mem, ops::Deref, ptr::addr_of};

use super::config::*;

use js_sys::{Reflect, Uint8ClampedArray};
use wasm_bindgen::{prelude::*, JsCast};
use web_sys::{DedicatedWorkerGlobalScope, ImageData, MessageEvent, Worker};

use std::slice;

use crate::{
    drawing::modes::DrawingModes,
    plotting::{fill_pixels, fill_pixels_simd, PlotScale},
};

use wasm_bindgen::__rt::WasmRefCell;

fn worker_onmessage_callback(event: MessageEvent) {
    let data = event.data();
    // log!("worker event data: {:#?}", &data);
    let ptr: u32 = Reflect::get(&data, &"ptr".into())
        .unwrap()
        .as_f64()
        .unwrap() as u32;

    let mut wasm_ref_cell = unsafe { Box::from_raw(ptr as *mut WasmRefCell<DrawingConfig>) };
    let drawing_config = wasm_ref_cell.get_mut();
    let drawing_config_ptr = addr_of!(*drawing_config);
    // log!("drawing_config: {:?}", drawing_config);
    let DrawingConfig {
        drawing_mode,
        plot_scale,
        roots,
        iterations_count,
        colors,
        part_offset,
        parts_count,
    } = drawing_config;

    log!(
        "Worker #{} got message",
        part_offset.or(Some(usize::MAX)).unwrap()
    );

    let colors_packed =
        unsafe { slice::from_raw_parts_mut(addr_of!(colors[0]) as *mut u32, colors.len()) };
    mem::forget(colors);

    let data = fill_pixels(
        plot_scale,
        roots,
        *iterations_count,
        colors_packed,
        *part_offset,
        *parts_count,
    );

    log!("data length: {:?}", &data.len());
    log!("first 10: {:?}", &data[0..10]);

    // let global = js_sys::global().unchecked_into::<DedicatedWorkerGlobalScope>();
    // let js_data = Uint8ClampedArray::from(data.as_slice());
    // match global.post_message(&js_data) {
    //     Ok(_) => log!("Sucessfuly sent data from worker"),
    //     Err(e) => log!("Error sending data from worker: {:?}", &e),
    // };
}

#[wasm_bindgen]
pub fn create_drawing_worker(worker_script_url: &str) -> Option<Worker> {
    let worker = match Worker::new(worker_script_url) {
        Ok(v) => v,
        Err(e) => {
            log!("Error creating drawing worker: {:?}", &e);
            return None;
        }
    };
    let callback = Closure::wrap(Box::new(worker_onmessage_callback.clone()) as Box<dyn Fn(_)>);
    worker.set_onmessage(Some(callback.as_ref().unchecked_ref()));
    callback.forget();
    Some(worker)
}
