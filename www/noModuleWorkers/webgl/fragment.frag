#version 300 es

precision highp float;

const uint max_roots_count = uint(500);

uniform int iterations_count;

uniform int roots_count;
uniform vec2 roots[max_roots_count];
uniform vec4 colors[max_roots_count];

uniform float x_offset;
uniform float y_offset;
uniform float x_value_range;
uniform float y_value_range;

in vec2 pos;
out vec4 out_color;

vec2 transform_shader_point_to_plot_scale(vec2 p) {
  float half_x_value_range = x_value_range / 2.0;
  float half_y_value_range = y_value_range / 2.0;
  vec2 mul = vec2(half_x_value_range, half_y_value_range);
  return p * mul +
         vec2(half_x_value_range + x_offset, -half_y_value_range - y_offset);
}

float calculate_square_norm(vec2 z) { return z.x * z.x + z.y * z.y; }

vec2 complex_inverse(vec2 z) {
  float square_sum = calculate_square_norm(z);
  return vec2(z.x / square_sum, -z.y / square_sum);
}

int get_rood_id(vec2 z, int iterations_count) {
  for (int _ = 0; _ < iterations_count; _++) {
    vec2 sum = vec2(0.0, 0.0);
    for (int i = 0; i < roots_count; i++) {
      vec2 diff = z - roots[i];
      float square_norm = calculate_square_norm(diff);
      if (square_norm < 1e-4) {
        return i;
      }
      diff.x /= square_norm;
      diff.y /= -square_norm;
      sum += diff;
    }
    z -= complex_inverse(sum);
  }

  float min_dst = 1.0 / 0.0;

  int min_dst_index = 0;
  for (int i = 0; i < roots_count; i++) {
    float dst = distance(z, roots[i]);
    if (dst < min_dst) {
      min_dst = dst;
      min_dst_index = i;
    }
  }

  return min_dst_index;
}

void main() {
  vec2 z = transform_shader_point_to_plot_scale(pos);
  z = vec2(z.x, -z.y);
  int root_id = get_rood_id(z, iterations_count);

  out_color = colors[root_id];
}