use super::config::*;

use js_sys::{Array, Uint8ClampedArray};
use serde::{Deserialize, Serialize};
use wasm_bindgen::{prelude::*, Clamped, JsCast, convert::IntoWasmAbi};
use web_sys::{ImageData, MessageEvent, Worker};

use crate::plotting::{fill_pixels, PlotScale};

fn worker_onmessage_callback(event: MessageEvent) {
    let data = event.data();
    log!("RUST: worker event data: {:#?}", &data);
    let ptr: u32 = data.into_abi();
    let drawing_config_ptr = unsafe { Box::from_raw(ptr as *mut DrawingConfig) };
    let drawing_config = drawing_config_ptr.as_ref();
    log!("RUST: drawing config: {:?}", drawing_config);
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
