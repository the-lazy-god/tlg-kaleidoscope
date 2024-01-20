document.addEventListener("DOMContentLoaded", function () {
  var vertex = `
varying vec2 vUv;
void main() {
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

  var fragment = `
precision mediump float; // Shader Precision
uniform sampler2D uTexture;
uniform vec4 resolution;
uniform float uOpacity;
varying vec2 vUv;
const float PI = 3.14159265359;
uniform float segments; // Number of segments
uniform vec2 uOffset;
uniform float uRotation;
uniform float uOffsetAmount;
uniform float uRotationAmount;
uniform float uScaleFactor;
uniform float uImageAspect; // Uniform for image aspect ratio

vec2 adjustUV(vec2 uv, vec2 offset, float rotation) {
vec2 uvOffset = uv + offset * uOffsetAmount;
float cosRot = cos(rotation * uRotationAmount);
float sinRot = sin(rotation * uRotationAmount);
mat2 rotMat = mat2(cosRot, -sinRot, sinRot, cosRot);
return rotMat * (uvOffset - vec2(0.5)) + vec2(0.5);
}

void main() {
vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
vec2 uv = newUV * 2.0 - 1.0;
float angle = atan(uv.y, uv.x);
float radius = length(uv);
float segment = PI * 2.0 / segments;
angle = mod(angle, segment);
angle = segment - abs(segment / 2.0 - angle);
uv = radius * vec2(cos(angle), sin(angle));
float scale = 1.0 / uScaleFactor;
vec2 adjustedUV = adjustUV(uv * scale + scale, uOffset, uRotation);
vec2 aspectCorrectedUV = vec2(adjustedUV.x, adjustedUV.y * uImageAspect);
vec2 tileIndex = floor(aspectCorrectedUV);
vec2 oddTile = mod(tileIndex, 2.0);
vec2 mirroredUV = mix(fract(aspectCorrectedUV), 1.0 - fract(aspectCorrectedUV), oddTile);
vec4 color = texture2D(uTexture, mirroredUV);
color.a *= uOpacity;
gl_FragColor = color;
}
`;

  class Sketch {
    constructor(options) {
      this.scene = new THREE.Scene();

      this.container = options.dom;
      this.container.style.position = 'relative';
      /* Attributes */
      const scaleAttr = this.container.getAttribute('tlg-kaleidoscope-scale');
      this.scaleFactor = parseFloat(scaleAttr) || 1;
      const motionAttr = this.container.getAttribute('tlg-kaleidoscope-motion');
      this.motionFactor = parseFloat(motionAttr) || 1;
      const modeAttr = this.container.getAttribute('tlg-kaleidoscope-mode');
      this.mode = ['loop', 'static', 'mouse', 'scroll'].includes(modeAttr) ? modeAttr : 'static';

      this.lastTime = performance.now() / 1000;
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(this.width, this.height);
      this.renderer.setClearColor(0xeeeeee, 1);
      this.renderer.physicallyCorrectLights = true;
      this.renderer.outputEncoding = THREE.sRGBEncoding;

      this.container.appendChild(this.renderer.domElement);

      var frustumSize = 1;
      this.camera = new THREE.OrthographicCamera(
        frustumSize / -2,
        frustumSize / 2,
        frustumSize / 2,
        frustumSize / -2,
        -1000,
        1000
      );
      this.camera.position.set(0, 0, 2);

      this.mouse = {
        x: 0,
        y: 0
      };

      this.isPlaying = true;
      this.addObjects();
      this.resize();
      this.render();
      this.setupResize();

      if (this.mode === 'mouse') {
        this.mouseEvents();
      }
      if (this.mode === 'scroll') {
        this.setupScroll();
        this.handleScroll();
      }
    }

    setupScroll() {
      window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    handleScroll() {
      const rect = this.container.getBoundingClientRect();
      const elemTop = rect.top;
      const elemBottom = rect.bottom;

      // Check if the element is in the viewport
      const isInViewport = elemTop < window.innerHeight && elemBottom >= 0;

      if (isInViewport) {
        const totalHeight = window.innerHeight + this.container.offsetHeight;
        const scrolled = window.innerHeight - elemTop;
        const progress = scrolled / totalHeight;
        const maxRotation = Math.PI * 2; // Full rotation
        this.material.uniforms.uRotation.value = progress * maxRotation * this.motionFactor;
      }
    }

    mouseEvents() {
      // Mouse event listener
      this.container.addEventListener("mousemove", (e) => {
        this.updateMousePosition(e.clientX, e.clientY);
      });

      // Touch event listeners
      this.container.addEventListener("touchmove", (e) => {
        if (e.touches.length > 0) {
          this.updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
        }
      });
    }

    updateMousePosition(clientX, clientY) {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = (clientX - rect.left) / this.width;
      this.mouse.y = (clientY - rect.top) / this.height;
    }


    setupResize() {
      window.addEventListener("resize", this.resize.bind(this));
    }

    resize() {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();

      let a1, a2;
      if (this.height / this.width > 1) {
        a1 = (this.width / this.height) * 1;
        a2 = 1;
      } else {
        a1 = 1;
        a2 = this.height / this.width / 1;
      }

      this.material.uniforms.resolution.value.x = this.width;
      this.material.uniforms.resolution.value.y = this.height;
      this.material.uniforms.resolution.value.z = a1;
      this.material.uniforms.resolution.value.w = a2;

      this.camera.updateProjectionMatrix();
    }

    addObjects() {
      // Get all child image textures
      const imageElements = this.container.querySelectorAll("[tlg-kaleidoscope-image]");

      const randomImageElement = imageElements[Math.floor(Math.random() * imageElements.length)];
      // Image aspect ratio
      const aspectAttr = randomImageElement.getAttribute('tlg-kaleidoscope-aspect');
      let aspectRatio;
      if (aspectAttr && aspectAttr.includes('/')) {
        const parts = aspectAttr.split('/');
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] !== "0") {
          aspectRatio = parseFloat(parts[0]) / parseFloat(parts[1]);
        }
      } else {
        aspectRatio = parseFloat(aspectAttr);
      }
      this.imageAspect = isNaN(aspectRatio) ? 1 : aspectRatio;
      // Set number of segments
      const segmentsAttribute = this.container.getAttribute("tlg-kaleidoscope-segments");
      this.segments = parseInt(segmentsAttribute, 10) || 6; // Default to 6

      const rendererElement = this.renderer.domElement;
      // Set styles for generated canvas
      rendererElement.style.position = 'absolute';
      rendererElement.style.top = '0';
      rendererElement.style.left = '0';
      rendererElement.style.zIndex = '-1';

      // Append the renderer element to the container
      this.container.appendChild(rendererElement);

      let texture = new THREE.TextureLoader().load(randomImageElement.src);
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      this.material = new THREE.ShaderMaterial({
        extensions: {
          derivatives: "#extension GL_OES_standard_derivatives : enable"
        },
        side: THREE.DoubleSide,
        uniforms: {
          resolution: {
            value: new THREE.Vector4()
          },
          uTexture: {
            value: texture
          },
          uOpacity: {
            value: 1
          },
          uOffset: {
            value: new THREE.Vector2(0, 0)
          },
          uRotation: {
            value: 0
          },
          uRotationAmount: {
            value: 0.2
          },
          uOffsetAmount: {
            value: 0.2
          },
          segments: {
            value: this.segments
          },
          uScaleFactor: {
            value: this.scaleFactor 
          },
          uImageAspect: {
            value: this.imageAspect 
          }
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true
      });

      this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
      this.plane = new THREE.Mesh(this.geometry, this.material);
      this.scene.add(this.plane);

      this.resize();
    }
    updateDataTexture(time) {
      time /= 1000; // Convert time to seconds
      if (this.mode === 'mouse') {
        const offsetX = (this.mouse.x - 0.5) * 2 * this.motionFactor;
        const offsetY = (this.mouse.y - 0.5) * 2 * this.motionFactor;

        this.material.uniforms.uOffset.value.set(offsetX, offsetY);
        const rotation = Math.PI * (this.mouse.y - 0.5) * 2 * this.motionFactor;

        this.material.uniforms.uRotation.value = rotation;
      } else if (this.mode === 'loop') {
        const deltaTime = time - this.lastTime;
        const rotationSpeed = 0.1;
        this.material.uniforms.uRotation.value += rotationSpeed * this.motionFactor * deltaTime;
        this.lastTime = time;
      }
    }

    render(time = 0) {
      if (!this.isPlaying) return;
      if (this.mode === 'mouse' || this.mode === 'loop') {
        this.updateDataTexture(time);
      }

      requestAnimationFrame(this.render.bind(this));
      this.renderer.render(this.scene, this.camera);
    }
  }
  // Create each canvas
  document.querySelectorAll("[tlg-kaleidoscope-canvas]").forEach((element) => {
    new Sketch({ dom: element });
  });
});
