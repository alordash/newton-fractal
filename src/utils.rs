use wasm_bindgen::__rt::WasmRefCell;

pub unsafe fn value_from_wasm_ref_cell_ptr<'a, T: Sized>(ptr: u32) -> &'a mut T {
    (&mut *(ptr as *mut WasmRefCell<T>)).get_mut()
}
