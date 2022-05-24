declare namespace wasm_bindgen {
	/* tslint:disable */
	/* eslint-disable */
	/**
	*/
	export function main(): void;
	/**
	* @param {number} drawing_mode
	* @param {any} plot_scale
	* @param {any} roots
	* @param {number} iterations_count
	* @param {any} colors
	* @param {number} buffer_ptr
	* @param {number | undefined} part_offset
	* @param {number | undefined} parts_count
	*/
	export function fill_pixels_wasm(drawing_mode: number, plot_scale: any, roots: any, iterations_count: number, colors: any, buffer_ptr: number, part_offset?: number, parts_count?: number): void;
	/**
	* @param {number} x
	* @param {number} y
	* @param {any} roots
	* @param {number} iterations_count
	* @returns {number}
	*/
	export function get_root_id_wasm(x: number, y: number, roots: any, iterations_count: number): number;
	/**
	* @returns {any}
	*/
	export function get_wasm_memory(): any;
	/**
	* @param {number} size
	* @returns {number | undefined}
	*/
	export function create_u32_buffer(size: number): number | undefined;
	/**
	* @param {number} size
	* @param {number} buffer_ptr
	*/
	export function free_u32_buffer(size: number, buffer_ptr: number): void;
	/**
	*/
	export enum DrawingModes {
	  Simd,
	  Scalar,
	}
	
}

declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
  readonly main: () => void;
  readonly fill_pixels_wasm: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly get_root_id_wasm: (a: number, b: number, c: number, d: number) => number;
  readonly get_wasm_memory: () => number;
  readonly create_u32_buffer: (a: number, b: number) => void;
  readonly free_u32_buffer: (a: number, b: number) => void;
  readonly memory: WebAssembly.Memory;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_start: () => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
* @param {WebAssembly.Memory} maybe_memory
*
* @returns {Promise<InitOutput>}
*/
declare function wasm_bindgen (module_or_path?: InitInput | Promise<InitInput>, maybe_memory?: WebAssembly.Memory): Promise<InitOutput>;
