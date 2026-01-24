import * as THREE from 'three';
import { Node, Connection, GRID_WORLD_SIZE } from '../studio/types';
import { generateFragmentShader } from '../studio/utils/shaderGenerator';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// GPU Heightmap generator - renders to a texture and reads back pixels
export class GPUHeightmapGenerator {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;
  private pixelBuffer: Uint8Array;
  public size: number;

  constructor(renderer: THREE.WebGLRenderer, size: number) {
    this.renderer = renderer;
    this.size = size;
    this.pixelBuffer = new Uint8Array(size * size * 4);

    // Orthographic camera looking at XY plane
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    this.camera.position.z = 1;

    // Scene with fullscreen quad
    this.scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(1, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }',
      uniforms: {
        uTime: { value: 0 },
        uGridSize: { value: GRID_WORLD_SIZE },
      },
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    // Render target for reading pixels
    this.renderTarget = new THREE.WebGLRenderTarget(size, size, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  updateShader(nodes: Node[], connections: Connection[], precomputedShader?: string) {
    const newFragmentShader = precomputedShader || generateFragmentShader(nodes, connections);
    
    // Only update if changed (simple check)
    if (this.material.fragmentShader !== newFragmentShader) {
      this.material.fragmentShader = newFragmentShader;
      this.material.needsUpdate = true;
    }
  }

  updateUniforms(time: number) {
    this.material.uniforms.uTime.value = time;
  }

  render(): Uint8Array {
    const currentRenderTarget = this.renderer.getRenderTarget();
    // Save current state
    const currentAutoClear = this.renderer.autoClear;
    this.renderer.autoClear = false;

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    
    this.renderer.readRenderTargetPixels(
      this.renderTarget,
      0,
      0,
      this.size,
      this.size,
      this.pixelBuffer
    );
    
    // Restore state
    this.renderer.setRenderTarget(currentRenderTarget);
    this.renderer.autoClear = currentAutoClear;
    
    return this.pixelBuffer;
  }

  getTexture(): THREE.Texture {
    return this.renderTarget.texture;
  }

  dispose() {
    this.renderTarget.dispose();
    this.material.dispose();
    // Geometry is shared/simple so strict disposal isn't critical but good practice if we stored it
  }
}
