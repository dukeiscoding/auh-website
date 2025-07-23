
      /*sidebar animation */
      (() => {
        const canvasContainer = document.getElementById("flameCanvas");
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        canvasContainer.appendChild(renderer.domElement);

        const uniforms = {
          time: { value: 0.0 },
          resolution: { value: new THREE.Vector2(350, 864) },
          mouse: { value: 0 },
        };

        const material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          fragmentShader: `
      uniform float time;
      uniform vec2 resolution;

      float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      float hermite(float t) {
        return t * t * (3.0 - 2.0 * t);
      }

      float noise(vec2 co, float frequency) {
        vec2 v = vec2(co.x * frequency, co.y * frequency);
        float ix1 = floor(v.x);
        float iy1 = floor(v.y);
        float ix2 = floor(v.x + 1.0);
        float iy2 = floor(v.y + 1.0);

        float fx = hermite(fract(v.x));
        float fy = hermite(fract(v.y));

        float fade1 = mix(rand(vec2(ix1, iy1)), rand(vec2(ix2, iy1)), fx);
        float fade2 = mix(rand(vec2(ix1, iy2)), rand(vec2(ix2, iy2)), fx);

        return mix(fade1, fade2, fy);
      }

      float pnoise(vec2 co, float freq, int steps, float persistence) {
        float value = 0.0;
        float ampl = 1.0;
        float sum = 0.0;
        for(int i=0 ; i<5 ; i++) {
          sum += ampl;
          value += noise(co, freq) * ampl;
          freq *= 2.0;
          ampl *= persistence;
        }
        return value / sum;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        // Base on left, flames to right
        float gradient = 1.0 - uv.x;
        
        vec2 pos = vec2(gl_FragCoord.y / resolution.y, gl_FragCoord.x / resolution.x);
        pos.y += time * -0.03;
        
        float noiseTexel = pnoise(pos, 12.0, 5, 0.6);
        
        // Flame steps
        float firstStep = smoothstep(0.0, noiseTexel, gradient);
        float darkerColorStep = smoothstep(0.0, noiseTexel, gradient - 0.15);
        float darkestStep = smoothstep(0.0, noiseTexel, gradient - 0.3);
        
        // Darker black and white
        vec4 flameColor = vec4(0.98, .92, .94, 1.0);
        vec4 midColor = vec4(0.88, .75, .82, 1.0);
        vec4 darkColor = vec4(0.75, .60, .70, 1.0);
        
        vec4 color = mix(flameColor, midColor, darkerColorStep - darkestStep);
        color = mix(color, darkColor, firstStep - darkerColorStep);
        color = mix(vec4(0.0), color, firstStep);

        if (color.r < 0.75) {
            color.a = 0.0;
        }

        gl_FragColor = vec4(color.rgb, color.a);
      }
    `,
          transparent: true,
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        function resizeFlameCanvas() {
          const width = canvasContainer.clientWidth;
          const height = canvasContainer.clientHeight;
          renderer.setSize(width, height);
          uniforms.resolution.value.set(width, height);
        }

        resizeFlameCanvas();
        window.addEventListener("resize", resizeFlameCanvas);

        function animate() {
          requestAnimationFrame(animate);
          uniforms.time.value += 0.003;
          renderer.render(scene, camera);
        }

        animate();
      })();