"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform float u_seed;
uniform vec2 u_resolution;

float hash(vec3 p) {
  p = fract(p * vec3(5.3983, 5.4427, 6.9371));
  p += dot(p.yzx, p + vec3(21.5351, 14.3137, 15.3219));
  return fract(p.x * p.y * p.z * 95.4337);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  float n = hash(vec3(cell, u_seed));

  if (n > 0.1) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    float r = hash(vec3(cell + vec2(1.0, 0.0), u_seed)) < 0.4 ? 0.0 : hash(vec3(cell + vec2(2.0, 0.0), u_seed)) * 0.235;
    float g = hash(vec3(cell + vec2(0.0, 1.0), u_seed)) < 0.4 ? 0.0 : hash(vec3(cell + vec2(0.0, 2.0), u_seed)) * 0.235;
    float b = hash(vec3(cell + vec2(1.0, 1.0), u_seed)) < 0.4 ? 0.0 : hash(vec3(cell + vec2(2.0, 2.0), u_seed)) * 0.235;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
}`;

function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  const aPos = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uSeed = gl.getUniformLocation(prog, "u_seed");
  const uRes = gl.getUniformLocation(prog, "u_resolution");

  return { gl, uSeed, uRes };
}

export default function NoiseBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = initGL(canvas);
    if (!ctx) return;
    const { gl, uSeed, uRes } = ctx;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    resize();

    const fps = 10;
    const interval = 1000 / fps;
    let last = 0;
    let frame = 0;
    let raf: number;

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      if (time - last < interval) return;
      last = time;
      gl.uniform1f(uSeed, (frame++) % 256);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "pointer-events-none fixed inset-0 -z-10 h-full w-full"}
    />
  );
}
