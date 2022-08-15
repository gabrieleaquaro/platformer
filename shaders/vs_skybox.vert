#version 300 es
in vec4 position;
out vec4 v_position;
void main() {
  v_position = position;
  gl_Position = vec4(position.xy, 1, 1);
}