macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&(String::from("RUST: ") + &format!( $( $t )* )).into());
    }
}
