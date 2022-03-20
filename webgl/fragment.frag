#version 300 es

precision highp float;

const uint max_roots_count = uint(512);

uniform uint roots_count;
uniform vec2 roots[max_roots_count];
uniform vec4 colors[max_roots_count];

out vec4 outColor;

in vec4 fragColor;

void main() {
  // outColor = vec4(1, 0, 0.5, 1);
  outColor = fragColor;
}