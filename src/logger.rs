pub use web_sys::console as web_console;

macro_rules! log {
    ( $( $t:tt )* ) => {
        web_console::log_1(&format!( $( $t )* ).into());
    }
}