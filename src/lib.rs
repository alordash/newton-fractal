use wasm_bindgen::prelude::*;

#[macro_use]
mod logger;
use logger::*;

pub mod polynomial;

pub mod plotting;

pub mod approximation;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    log!("asd {}", 1);
    Ok(())
}

