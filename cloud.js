const canvas = document.getElementById('cloudCanvas');

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true
});

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  iTime: { value: 0 },
  iResolution: { value: new THREE.Vector2() },
  iMouse: { value: new THREE.Vector2(0, 0) }
};

const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  transparent: true,
  fragmentShader: `
    #define ITR 30.
    #define EPSILON 0.001
    #define PI 3.14159265359
    #define TWO_PI 6.28318530718

    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec2 iMouse;

    vec3 sun, sun_col;

    float N11(float n) {
      return fract(sin(n)*43758.5453);
    }

    float N31(in vec3 n) {
      vec3 i = floor(n);
      vec3 f = fract(n);
      f = f*f*(3.-2.*f);
      float q = i.x+i.y*57.+i.z*113.;
      float r = mix(
        mix(mix(N11(q+0.),N11(q+1.),f.x), mix(N11(q+57.),N11(q+58.),f.x), f.y),
        mix(mix(N11(q+113.),N11(q+114.),f.x), mix(N11(q+170.),N11(q+171.),f.x), f.y),
        f.z
      );
      return r;
    }

    float fbm(vec3 p) {
      float f = 0.5 * N31(p);
      return f;
    }

    float sphere(vec3 q, float r) {
      vec3 p = q * 0.5;
      p *= 1.0 - 0.3 * vec3(0.1, 0.2, 0.1);
      p.z *= 0.6;
      p.y -= pow(abs(p.x) / 15.0, -p.y * 0.1 + 1.5) * 1.2;
      p.x *= 0.8;
      return length(p) - r;
    }

    float scene(in vec3 q) {
      vec3 p = q - vec3(0.0, 0.0, 0.5) * sin(iTime * 0.8);
      float f = fbm(p);
      float d = 1.0 - sphere(p, 1.7);
      d += 1.2 * f;
      return clamp(d, 0.0, 0.6);
    }

    mat3 camera(vec3 ro, vec3 ta, float roll) {
      vec3 f = normalize(ta - ro);
      vec3 up = vec3(sin(roll), cos(roll), 0.0);
      vec3 r = normalize(cross(f, up));
      vec3 u = cross(r, f);
      return mat3(r, u, f);
    }

    vec3 rayDirection(vec2 uv, vec3 ro, vec3 ta, float zoom, float roll) {
      mat3 cam = camera(ro, ta, roll);
      return normalize(cam * vec3(uv, zoom));
    }

    void luminance(inout vec3 col, float lum) {
      lum /= dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
      col *= lum;
    }

    float fillMask(float dist) {
      return clamp(-dist, 0.0, 1.0);
    }

    vec3 draw_light(vec3 p, vec3 l, vec3 color, float range, float radius, float shad) {
      float ld = length(p - l);
      if (ld > range) return vec3(0.0);
      float fall = pow((range - ld) / range, 2.0);
      float source = fillMask(sphere(p - l, radius));
      return (shad * fall + source) * color;
    }

    vec4 march(vec3 ro, vec3 rd) {
      float t = 0.0;
      float denseD2 = 0.01;
      float denseE2 = 0.2;
      vec4 col = vec4(0.0);

      for (float i = 0.0; i < 1.0; i += 1.0 / ITR) {
        vec3 p = ro + t * rd;
        float d = scene(p);
        vec4 color = vec4(d);
        luminance(sun_col, 1.5);
        vec3 s = draw_light(p, sun, sun_col, 100.0, 8.0, 0.4);
        color.rgb *= mix(s, color.rgb, 0.4);
        color *= 1.2 * exp(-pow((d - denseD2), 2.0) / denseE2);
        col += color * (1.0 - col.a);
        t += i;
      }

      col.rgb = clamp(col.rgb, 0.0, 1.0);
      return col;
    }

    void main() {
      vec2 st = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
      vec2 uv = st * .86;

      vec3 ro = vec3(15.0 + 0.25 * cos(iTime * 0.33), 4.0 + 0.05 * sin(iTime * 0.15), -7.0);
      vec3 ta = vec3(0.0);
      vec3 rd = rayDirection(uv, ro, ta, 1.0, 0.0);

      sun = vec3(5.0 + sin(iTime * 0.2) * 3.0, 15.0, 5.0 + cos(iTime * 0.33) * 10.0);
      sun_col = vec3(0.9, 0.3, 0.2);

      vec4 col = march(ro, rd);

      float a = 1.5;
      float b = -0.001;
      vec3 colr = col.rgb * a * exp(b * col.a * col.a);
      colr = pow(colr, vec3(1.0 / 2.2));

      gl_FragColor = vec4(colr, col.a);
    }
  `
});

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(mesh);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  uniforms.iTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}

// Dynamic canvas sizing based on parent container
function resizeCanvas() {
  const container = canvas.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;

  renderer.setSize(width, height, false);
  uniforms.iResolution.value.set(width, height);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

window.addEventListener('mousemove', (event) => {
  uniforms.iMouse.value.set(event.clientX, event.clientY);
});

animate();