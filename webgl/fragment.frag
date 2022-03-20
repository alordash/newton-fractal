#version 300 es

precision highp float;

const float point_display_threshold = 0.01;
const uint max_roots_count = uint(500);

uniform int roots_count;
uniform vec2 roots[max_roots_count];
uniform vec4 colors[max_roots_count];

uniform float x_offset;
uniform float y_offset;
uniform float x_value_range;
uniform float y_value_range;
uniform float x_display_range;
uniform float y_display_range;

vec2 transform_plot_point_to_shader_scale(vec2 p) {
  return vec2((p.x - x_offset) / x_value_range - 1.0,
              (p.y - y_offset) / y_value_range - 1.0);
}

vec2 transform_shader_point_to_plot_scale(vec2 p) {
  vec2 mul = vec2(x_value_range / 2.0, y_value_range / 2.0);
  return p * mul + vec2(x_value_range / 2.0 + x_offset, -y_value_range / 2.0 - y_offset);
}

in vec2 pos;
out vec4 out_color;

void main() {
  vec2 z = transform_shader_point_to_plot_scale(pos);
  z = vec2(z.x, -z.y);

  float min_dst = 10e6;
  int min_dst_index = 0;
  for (int i = 0; i < roots_count; i++) {
    float dst = distance(z, roots[i]);
    if (dst < min_dst) {
      min_dst = dst;
      min_dst_index = i;
    }
  }
  float coef = point_display_threshold / x_display_range;
  if (min_dst < coef * 1600.0) {
    if(min_dst < coef * 1000.0) {
    out_color = vec4(1, 1, 1, 1);
    } else {
    out_color = vec4(0, 0, 0, 1);
    }
  } else {
    out_color = colors[min_dst_index];
  }
}