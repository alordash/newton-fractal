#version 300 es

precision highp float;

const float point_display_threshold = 0.01;
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

struct ApproxResult {
  int index;
  vec2 z;
};

vec2 transform_shader_point_to_plot_scale(vec2 p) {
  vec2 mul = vec2(x_value_range / 2.0, y_value_range / 2.0);
  return p * mul +
         vec2(x_value_range / 2.0 + x_offset, -y_value_range / 2.0 - y_offset);
}

vec2 complex_inverse(vec2 z) {
  float square_sum = z.x * z.x + z.y * z.y;
  return vec2(z.x / square_sum, -z.y / square_sum);
}

ApproxResult newton_method_approx(vec2 z) {
  vec2 sum = vec2(0.0, 0.0);
  for (int i = 0; i < roots_count; i++) {
    vec2 diff = z - roots[i];
    if (length(diff) < 1e-10) {
      return ApproxResult(i, z);
    }
    sum += complex_inverse(diff);
  }
  return ApproxResult(-1, z - complex_inverse(sum));
}

ApproxResult find_root(vec2 z) {
  for (int i = 0; i < iterations_count; i++) {
    ApproxResult result = newton_method_approx(z);
    if (result.index != -1) {
      return result;
    }
    z = result.z;
  }
  return ApproxResult(-1, z);
}

void main() {
  vec2 z = transform_shader_point_to_plot_scale(pos);
  z = vec2(z.x, -z.y);
  ApproxResult found_root = find_root(z);
  if (found_root.index != -1) {
    out_color = colors[found_root.index];
  } else {
    vec2 root = found_root.z;

    float min_dst = 1.0 / 0.0;
    int min_dst_index = 1;
    for (int i = 0; i < roots_count; i++) {
      float dst = distance(root, roots[i]);
      if (dst < min_dst) {
        min_dst = dst;
        min_dst_index = i;
      }
    }
    out_color = colors[min_dst_index];
  }
}