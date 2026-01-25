import React, { useRef, useEffect, useMemo } from 'react';
import { Node, Connection, GRID_WORLD_SIZE } from './types';
import { generateFragmentShader } from './utils/shaderGenerator';

interface TextureCanvasProps {
  nodes: Node[];
  connections: Connection[];
  paused: boolean;
  aspect: number;
  speed?: number;
}

export const TextureCanvas: React.FC<TextureCanvasProps> = ({
  nodes,
  connections,
  paused,
  aspect,
  speed = 1.0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);

  // Generate Shader Code
  const fragmentShaderSource = useMemo(() => {
    // Enable WorldPos for correct aspect ratio handling
    return generateFragmentShader(nodes, connections, { useWorldPos: true });
  }, [nodes, connections]);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;

    // Default Vertex Shader (Full Screen Quad)
    const vertexShaderSource = `
      precision highp float;
      attribute vec2 position;
      varying vec2 vUv;
      varying vec3 vPos;
      uniform float uAspect;
      uniform float uGridSize;
      
      void main() {
        vUv = position * 0.5 + 0.5;
        // World Position Calculation matching the R3F logic:
        // Center is 0,0. x extends by aspect.
        // vPos.x range: [-uGridSize/2 * uAspect, uGridSize/2 * uAspect]
        // vPos.y range: [-uGridSize/2, uGridSize/2]
        // vPos.z = 0.0
        
        vec2 centered = (vUv - 0.5);
        // Correctly aspect-ratio-scaled world position
        vPos = vec3(centered.x * uGridSize * uAspect, centered.y * uGridSize, 0.0);
        
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Compile Shaders
    const createShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Buffer Setup (Full Screen Quad)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  }, [fragmentShaderSource]); // Recompile when shader source changes

  // Render Loop
  useEffect(() => {
    const render = () => {
        const gl = glRef.current;
        const program = programRef.current;
        const canvas = canvasRef.current;
        if (!gl || !program || !canvas) return;

        // Resize
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        gl.useProgram(program);

        // Uniforms
        const uTimeLoc = gl.getUniformLocation(program, 'uTime');
        const uGridSizeLoc = gl.getUniformLocation(program, 'uGridSize');
        const uAspectLoc = gl.getUniformLocation(program, 'uAspect');

        if (uTimeLoc) gl.uniform1f(uTimeLoc, timeRef.current);
        if (uGridSizeLoc) gl.uniform1f(uGridSizeLoc, GRID_WORLD_SIZE);
        if (uAspectLoc) gl.uniform1f(uAspectLoc, aspect);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (!paused) {
            timeRef.current += 0.016 * speed; // Approx 60fps * speed
            animationFrameRef.current = requestAnimationFrame(render);
        }
    };

    if (!paused) {
        animationFrameRef.current = requestAnimationFrame(render);
    } else {
        render(); // Render once if paused
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [paused, fragmentShaderSource, aspect, speed]); // Re-bind render loop if these change

  return (
    <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
    />
  );
};
