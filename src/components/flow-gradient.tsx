import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useIsFocused } from 'expo-router';

/**
 * Animirana pozadina kroz fragment sejder.
 *
 * `@firecms/neat` crta u DOM <canvas> preko Three.js — toga u React Native-u
 * nema, pa se biblioteka ne moze koristiti direktno. Ali sustina je jedan
 * fragment sejder, i njega pokrece `expo-gl`, koji JESTE deo Expo SDK-a
 * (za razliku od Skie, koja trazi dev build).
 *
 * Preneseni su parametri koji se vizuelno vide: boje, brzina, talasi,
 * iskrivljenje domena i mesanje boja. Izostavljeno je sve sto zavisi od 3D
 * scene (shapeType, kamera, bloom) — toga ovde nema.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_c0;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_c3;
uniform vec3  u_bg;
uniform float u_speed;
uniform float u_waveX;
uniform float u_waveY;
uniform float u_amp;
uniform float u_blend;
uniform float u_warp;
uniform float u_warpScale;
uniform float u_vignette;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);           // glatka interpolacija
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

/** Slojevit sum — svaki sloj duplo sitniji i duplo slabiji. */
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * u_speed * 0.06;

  // Iskrivljenje domena: sum pomera koordinate pre nego sto se racuna polje.
  // To je ono sto pravi organske, uvijene oblike umesto pravilnih talasa.
  vec2 q = vec2(
    fbm(uv * u_warpScale + vec2(0.0, t)),
    fbm(uv * u_warpScale + vec2(5.2, 1.3) - t * 0.8)
  );
  vec2 p = uv + (q - 0.5) * u_warp;

  // Talasi daju usmereno kretanje preko sumnog polja.
  float w = sin(p.x * u_waveX + t * 1.3) * cos(p.y * u_waveY - t);
  float field = fbm(p * 1.7 + w * u_amp * 0.06 + t * 0.35);

  // Drugo polje, pomereno, da se boje ne slazu u trake.
  float field2 = fbm(p * 1.15 + vec2(3.7, 8.1) - t * 0.22);

  float k = clamp(field * u_blend, 0.0, 1.0);
  float k2 = clamp(field2 * u_blend, 0.0, 1.0);

  vec3 col = mix(u_c0, u_c1, smoothstep(0.15, 0.65, k));
  col = mix(col, u_c2, smoothstep(0.35, 0.85, k2));
  col = mix(col, u_c3, smoothstep(0.55, 0.95, k * k2 * 1.6));
  col = mix(u_bg, col, 0.92);

  // Vinjeta — blago tamnjenje ka ivicama, da sredina ostane mirna.
  float d = distance(uv, vec2(0.5));
  col *= 1.0 - u_vignette * smoothstep(0.35, 0.95, d);

  gl_FragColor = vec4(col, 1.0);
}
`;

export type FlowConfig = {
  colors: [string, string, string, string];
  background: string;
  speed?: number;
  waveFrequencyX?: number;
  waveFrequencyY?: number;
  waveAmplitude?: number;
  colorBlending?: number;
  warpIntensity?: number;
  warpScale?: number;
  vignette?: number;
};

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export function FlowGradient({ config, active = true }: { config: FlowConfig; active?: boolean }) {
  const raf = React.useRef<number | null>(null);
  const running = React.useRef(active);
  running.current = active;

  const onContextCreate = React.useCallback((gl: ExpoWebGLRenderingContext) => {
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('shader:', gl.getShaderInfoLog(sh));
      }
      return sh;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Dva trougla preko celog ekrana.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    gl.uniform2f(u('u_res'), gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform3fv(u('u_c0'), rgb(config.colors[0]));
    gl.uniform3fv(u('u_c1'), rgb(config.colors[1]));
    gl.uniform3fv(u('u_c2'), rgb(config.colors[2]));
    gl.uniform3fv(u('u_c3'), rgb(config.colors[3]));
    gl.uniform3fv(u('u_bg'), rgb(config.background));
    gl.uniform1f(u('u_speed'), config.speed ?? 2.5);
    gl.uniform1f(u('u_waveX'), config.waveFrequencyX ?? 2);
    gl.uniform1f(u('u_waveY'), config.waveFrequencyY ?? 3);
    gl.uniform1f(u('u_amp'), config.waveAmplitude ?? 6);
    gl.uniform1f(u('u_blend'), config.colorBlending ?? 1.6);
    gl.uniform1f(u('u_warp'), config.warpIntensity ?? 0.35);
    gl.uniform1f(u('u_warpScale'), config.warpScale ?? 2.4);
    gl.uniform1f(u('u_vignette'), config.vignette ?? 0.2);

    const uTime = u('u_time');
    const start = Date.now();

    const draw = () => {
      // Kad ekran nije u fokusu ne crtamo — GPU petlja inace radi u pozadini.
      if (running.current) {
        gl.uniform1f(uTime, (Date.now() - start) / 1000);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.endFrameEXP();
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();
  }, [config]);

  React.useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}

/**
 * Poslata konfiguracija, ali sa POSVETLJENIM bojama — isti tonovi, veca
 * svetlina. Original ima plavu na 4,0:1 i crvenu na 3,9:1 prema crnom tekstu,
 * sto je ispod i najblazeg standarda (4,5:1). Ovako tonovi ostaju
 * prepoznatljivi a tekst citljiv.
 *
 * Original je sacuvan u NEAT_CONFIG_VIVID ako zatreba za poredjenje.
 */
export const NEAT_CONFIG: FlowConfig = {
  colors: ['#A9CFE9', '#EDD9BC', '#E9CFE9', '#F6BFD1'],
  background: '#EFF1F6',
  speed: 2.5,
  waveFrequencyX: 2,
  waveFrequencyY: 3,
  waveAmplitude: 6,
  colorBlending: 1.6,
  warpIntensity: 0.35,
  warpScale: 2.4,
  vignette: 0.45,
};

export function FlowBackground({ config }: { config: FlowConfig }) {
  const focused = useIsFocused();
  return <FlowGradient config={config} active={focused} />;
}

/** Original poslate palete — presnazan za crn tekst, cuva se za poredjenje. */
export const NEAT_CONFIG_VIVID: FlowConfig = {
  ...NEAT_CONFIG,
  colors: ['#167CB3', '#CB9854', '#CE96CE', '#E0115F'],
  background: '#A1A4B7',
};
