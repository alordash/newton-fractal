#version 300 es

in vec4 a_position;

out vec4 fragColor;

void main() {
  gl_Position = a_position;
  fragColor = a_position;
}