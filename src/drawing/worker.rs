use super::config::*;

use js_sys::{Array, Uint8ClampedArray};
use serde::{Deserialize, Serialize};
use wasm_bindgen::{prelude::*, Clamped, JsCast};
use web_sys::{ImageData, MessageEvent, Worker};

use crate::plotting::{PlotScale, fill_pixels};

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum DrawingModes {
    CPU_WASM_SIMD = "CPU-wasm-simd",
    CPU_WASM_SCALAR = "CPU-wasm-scalara",
    CPU_JS_SCALAR = "CPU-js-scalar",
}

fn worker_onmessage_callback(event: MessageEvent) {
    log!("RUST: worker event data: {:#?}", event.data());
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
