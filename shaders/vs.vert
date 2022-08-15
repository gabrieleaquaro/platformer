#version 300 es
uniform mat4 matrix;
uniform mat4 pMatrix;
uniform mat4 nMatrix;

in vec4 position;
in vec3 normal;
in vec2 texcoord;

out vec3 v_position;
out vec2 v_texCoord;
out vec3 v_normal;


void main() {
  v_texCoord = texcoord;
  v_position = (pMatrix * position).xyz;
  v_normal = mat3(nMatrix) * normal;

  gl_Position = matrix * position;
}