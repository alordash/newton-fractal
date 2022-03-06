use super::config::*;

use js_sys::Reflect;
use wasm_bindgen::{prelude::*, JsCast};
use web_sys::{ImageData, MessageEvent, Worker};

use crate::{
    plotting::{fill_pixels, PlotScale},
    utils::value_from_wasm_ref_cell_ptr,
};

fn worker_onmessage_callback(event: MessageEvent) {
    let data = event.data();
    log!("worker event data: {:#?}", &data);
    let ptr: u32 = Reflect::get(&data, &"ptr".into())
        .unwrap()
        .as_f64()
        .unwrap() as u32;
    let drawing_config = unsafe { value_from_wasm_ref_cell_ptr::<DrawingConfig>(ptr) };
    log!("drawing_config: {:?}", drawing_config);
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
