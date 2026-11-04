// Headless Edge for the playtests, rendering on the GPU (D3D11). SwiftShader (software WebGL, pins every core)
// only when PT_SOFTWARE=1 or when hardware WebGL won't start.
const { chromium } = require('playwright');
const KEEP = ['--disable-gpu-watchdog', '--disable-renderer-backgrounding'];
const GPU = ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', ...KEEP];
const SOFT = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...KEEP];
const launch = args => chromium.launch({ channel: process.env.PT_BROWSER || 'msedge', args });

async function gpuWorks(b) {
  const p = await b.newPage();
  const r = await p.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2'); if (!gl) return null;
    const x = gl.getExtension('WEBGL_debug_renderer_info');
    return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  }).catch(() => null);
  await p.close();
  return r && !/swiftshader|basic render|llvmpipe/i.test(r) ? r : null;
}

async function browser() {
  if (process.env.PT_SOFTWARE !== '1') {
    const b = await launch(GPU), r = await gpuWorks(b);
    if (r) { console.log('renderer:', r); return b; }
    await b.close(); console.log('hardware WebGL failed, falling back to SwiftShader');
  }
  console.log('renderer: SwiftShader (software)');
  return launch(SOFT);
}
module.exports = { browser };
