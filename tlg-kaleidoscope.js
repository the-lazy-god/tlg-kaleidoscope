document.addEventListener("DOMContentLoaded", function () {
    /* THREE JS Kaleidoscope snippet by thelazygod */
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
    vec2 tileIndex = floor(adjustedUV);
    vec2 oddTile = mod(tileIndex, 2.0);
    vec2 mirroredUV = mix(fract(adjustedUV), 1.0 - fract(adjustedUV), oddTile);
    vec4 color = texture2D(uTexture, mirroredUV);
    color.a *= uOpacity;
    gl_FragColor = color;
    }
    `;
    
      function clamp(number, min, max) {
        return Math.max(min, Math.min(number, max));
      }
    
      class Sketch {
        constructor(options) {
          this.scene = new THREE.Scene();
    
          this.container = options.dom;
          const scaleAttr = this.container.getAttribute('tlg-kaleidoscope-scale');
          this.scaleFactor = parseFloat(scaleAttr) || 1; // Default to 1 if attribute is not valid or not present
          const motionAttr = this.container.getAttribute('tlg-kaleidoscope-motion');
          this.motionFactor = parseFloat(motionAttr) || 1; // Default to 1 if attribute is not valid or not present
    
          this.width = this.container.offsetWidth;
          this.height = this.container.offsetHeight;
          this.renderer = new THREE.WebGLRenderer();
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          this.renderer.setSize(this.width, this.height);
          this.renderer.setClearColor(0xeeeeee, 1);
          this.renderer.physicallyCorrectLights = true;
          this.renderer.outputEncoding = THREE.sRGBEncoding;
    
          this.container.appendChild(this.renderer.domElement);
    
          this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            100
          );
    
          var frustumSize = 1;
          var aspect = window.innerWidth / window.innerHeight;
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
          this.mouseEvents();
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
    
          // Image aspect square
          this.imageAspect = 1;
    
          let a1;
          let a2;
          if (this.height / this.width > this.imageAspect) {
            a1 = (this.width / this.height) * this.imageAspect;
            a2 = 1;
          } else {
            a1 = 1;
            a2 = this.height / this.width / this.imageAspect;
          }
    
          this.material.uniforms.resolution.value.x = this.width;
          this.material.uniforms.resolution.value.y = this.height;
          this.material.uniforms.resolution.value.z = a1;
          this.material.uniforms.resolution.value.w = a2;
    
          this.camera.updateProjectionMatrix();
        }
    
        addObjects() {
          // Get all child elements with the attribute [tlg-kaleidoscope-image]
          const imageElements = this.container.querySelectorAll("[tlg-kaleidoscope-image]");
    
          // Choose a random image element
          const randomImageElement = imageElements[Math.floor(Math.random() * imageElements.length)];
    
          // Set number of segments
          const segmentsAttribute = this.container.getAttribute("tlg-kaleidoscope-segments");
          this.segments = parseInt(segmentsAttribute, 10) || 6; // Default to 6 if not a valid number
    
          // Create the renderer element
          const rendererElement = this.renderer.domElement;
    
          // Set styles for the renderer element (generated canvas)
          rendererElement.style.position = 'absolute';
          rendererElement.style.top = '0';
          rendererElement.style.left = '0';
          rendererElement.style.zIndex = '-1';
    
          // Append the renderer element to the container
          this.container.appendChild(rendererElement);
    
          // Load the texture from the chosen image element
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
              uDataTexture: {
                value: new THREE.DataTexture(
                  null,
                  1,
                  1,
                  THREE.RGBFormat,
                  THREE.FloatType
                )
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
    
        updateDataTexture() {
          // Assuming mouse.x and mouse.y are normalized to [0, 1]
          // Apply motionFactor to control the intensity of the effect
          const offsetX = (this.mouse.x - 0.5) * 2 * this.motionFactor; // map to [-1, 1] and apply motionFactor
          const offsetY = (this.mouse.y - 0.5) * 2 * this.motionFactor; // map to [-1, 1] and apply motionFactor
    
          this.material.uniforms.uOffset.value.set(offsetX, offsetY);
    
          // Assume a full rotation over the height of the canvas
          // Apply motionFactor to control the rotation intensity
          const rotation = Math.PI * (this.mouse.y - 0.5) * 2 * this.motionFactor; // map y to [-PI, PI] and apply motionFactor
    
          this.material.uniforms.uRotation.value = rotation;
        }
    
        render() {
          if (!this.isPlaying) return;
          this.updateDataTexture();
          requestAnimationFrame(this.render.bind(this));
          this.renderer.render(this.scene, this.camera);
        }
      }
    
      // Create each canvas
      document.querySelectorAll("[tlg-kaleidoscope-canvas]").forEach((element) => {
        new Sketch({ dom: element });
      });
});