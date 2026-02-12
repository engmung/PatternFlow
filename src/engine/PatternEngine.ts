import { WebGLRenderer } from 'three';
import { Node, Connection, GRID_SIZE } from '../types/graph';
import { generateFragmentShader } from './shaderGenerator';
import { GPUHeightmapGenerator } from './GPUHeightmapGenerator';

/**
 * The core engine that manages the pattern generation lifecycle.
 * It abstracts away the complexity of Shader generation and GPU rendering.
 */
export class PatternEngine {
  private generator: GPUHeightmapGenerator;
  private currentFragmentShader: string = '';

  constructor(renderer: WebGLRenderer, resolution: number = GRID_SIZE) {
    this.generator = new GPUHeightmapGenerator(renderer, resolution);
  }

  /**
   * Updates the internal shader based on the node graph.
   * Best practice: Call this only when nodes/connections change.
   */
  updateGraph(nodes: Node[], connections: Connection[]) {
    const newShader = generateFragmentShader(nodes, connections);
    if (newShader !== this.currentFragmentShader) {
      this.currentFragmentShader = newShader;
      this.generator.updateShader(nodes, connections, newShader);
    }
  }

  /**
   * Renders the current pattern at a specific time.
   * Returns the raw pixel buffer (heightmap data).
   */
  render(time: number): Uint8Array {
    this.generator.updateUniforms(time);
    return this.generator.render();
  }

  /**
   * Returns the generated texture (for use in shaders/materials).
   */
  getTexture() {
    return this.generator.getTexture();
  }

  /**
   * Clean up resources.
   */
  dispose() {
    this.generator.dispose();
  }
}
