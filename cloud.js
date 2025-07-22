const canvas = document.getElementById('cloudCanvas');
const renderer = new THREE.WebGLRenderer({ 
  canvas: canvas, 
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  iTime: { value: 0 },
  iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
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
    vec3 normal;

    struct ray {
        vec3 o;
        vec3 d;
        vec3 t;
    };

    float N21(vec3 n) {
      return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))*43758.5453);
    }

    float N11(float n) {
      return fract(sin(n)*43758.5453);
    }

    float N31(in vec3 n) {
      vec3 i = floor(n);
      vec3 f = fract(n);
      f = f*f*(3.-2.*f);
      float q = i.x+i.y*57.+i.z*113.;
      float r = mix(
          mix(
              mix(N11(q+0.),N11(q+1.),f.x),
              mix(N11(q+57.),N11(q+58.),f.x),
              f.y),
          mix(
              mix(N11(q+113.),N11(q+114.),f.x),
              mix(N11(q+170.),N11(q+171.),f.x),
              f.y),
          f.z);
      return r;
    }

    float fbm(vec3 p) {
      float f = 0.5*N31(p);
      return f;
    }

    float sphere(vec3 q, float r) {
      vec3 p = q * .5;
      p *= 1. - .3*vec3(.1,0.2,.1);
      p.z *= .6;
      p.y -= pow(abs(p.x)/15.,-p.y*.1+1.5)*1.2;
      p.x *= .8;
      return length(p) - r;
    }

    float scene(in vec3 q) {
      vec3 p = q - vec3(0.0,0.,0.5)*sin(iTime*.8);
      float f = fbm(p);
      float d = 1.;
      d -= sphere(p,1.7);
      d += 1.2*f;
      return clamp(d,0.,.6);
    }

    mat3 camera(ray r, float roll) {
      vec3 f = normalize(r.t-r.o);
      vec3 up = vec3(sin(roll),cos(roll),0.);
      vec3 u = normalize(cross(f,up));
      vec3 v = normalize(cross(u,f));
      return mat3(u,v,f);
    }

    ray raydir(vec2 uv) {
      vec2 m = iMouse.xy / iResolution.xy;
      float zoom = 1., roll=0.;
      float camY = 4. + .05*sin(iTime*.15);
      float camX = 15. + .25*cos(iTime*.33);
      float camZ = zoom - 8.;
      vec3 camPos = vec3(camX,camY,camZ);
      vec3 lookat = vec3(0.);
      ray r;
      r.o = camPos;
      r.t = lookat;
      mat3 viewCam = camera(r, roll);
      vec3 rd = viewCam * normalize(vec3(uv,zoom));
      r.d = normalize(rd);
      return r;
    }

    void luminance(inout vec3 col, float lum) {
      lum /= dot(col.rgb,vec3(0.2126,0.7152,0.0722));
      col *= lum;
    }

    float fillMask(float dist) {
      return clamp(-dist, 0.0, 1.0);
    }

    vec3 draw_light(vec3 p, vec3 l, vec3 color, float range, float radius, float shad) {
      float ld = length(p - l);
      if (ld > range) return vec3(0.);
      float fall = (range - ld)/range;
      fall *= fall;
      float source = fillMask(sphere(p - l, radius));
      return (shad*fall + source) * color;
    }

    vec4 march(vec3 ro, vec3 rd) {
      float t = 0.0;
      float denseD2 = .01;
      float denseE2 = .2;
      vec4 col = vec4(0.0);
      
      for (float i = 0.; i < 1.; i+=1./ITR) {
        vec3 p = ro + t * rd;
        float d = scene(p);
        vec4 color = vec4(d);
        luminance(sun_col,1.5);
        vec3 s = draw_light(p,sun,sun_col,100.,8.,.4);
        color.rgb *= mix(s,color.rgb,.4);
        color *= 1.2*exp(-(d-denseD2)*(d-denseD2)/denseE2);
        col += color * (1. - col.a);
        t += i;
      }
      
      col.rgb = clamp(col.rgb, 0., 1.);
      return col;
    }

    void main() {
      vec2 st = (gl_FragCoord.xy-.5*iResolution.xy)/iResolution.y;
      vec2 uv = st*0.86;

      ray r = raydir(uv);
      sun = vec3(5.+sin(iTime*0.2)*3.0, 15., 5.+cos(iTime*.33)*10.);
      sun_col = vec3(.9, .3, 0.2);

      vec4 col = march(r.o, r.d);
      
      // Modified output - only show clouds with transparency
      float a = 1.5;
      float b = -.001;
      vec3 colr = col.rgb * a * exp(b*col.a*col.a);
      colr = pow(colr, vec3(1./2.2));
      
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

window.addEventListener('mousemove', (event) => {
  uniforms.iMouse.value.set(event.clientX, event.clientY);
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
});

animate();