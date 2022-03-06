precision mediump float;

uniform sampler2D u_imageTarget;
uniform sampler2D u_imageMask;
uniform sampler2D u_turbMask;
uniform vec2 u_resolution;

varying vec2 v_texCoord;
float PI = 3.14159265358979323846264;

float threshold = 0.8;

vec3 red = vec3(0.7412, 0.0, 0.0);
vec3 yellow = vec3(1.0, 0.8706, 0.4431);

vec3 fire(float d) {
  return yellow * d * 0.6 + red * (1. - d * 0.6);
}

void main() {
  vec4 turb = texture2D(u_turbMask, v_texCoord);
  float d = turb.r;
  float theta = d * 2. * PI;
  vec2 direction = vec2(cos(theta), sin(theta));
  vec2 displacementVector = direction * d * 0.05;
  vec4 effect = texture2D(u_imageMask, v_texCoord + displacementVector * 1.5);
  float e = effect.a;

  float alpha = e;
  vec4 video = texture2D(u_imageTarget, v_texCoord + displacementVector * e);
  float g = (video.r + video.g + video.b) / 3.;
  vec3 gray = vec3(g, g, g);

  if (e > 0.0) {
    gl_FragColor = vec4(fire(e) * alpha + gray * (1. - alpha), 1.);
  } else {
    gl_FragColor = vec4(gray, 1.);
  }
}