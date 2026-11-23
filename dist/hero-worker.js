// Background worker that draws the cover's rotating scroll on an OffscreenCanvas.
import { drawHeroScene } from './hero-render.js?v=20261123-ink';

let canvas = null, ctx = null, size = null, state = { rotation: -.36, mode: 'layers' }, pending = false;

function render() {
  pending = false;
  if (!ctx || !size) return;
  ctx.setTransform(canvas.width / size.w, 0, 0, canvas.height / size.h, 0, 0);
  drawHeroScene(ctx, size.w, size.h, state.rotation, state.mode);
}
// Several requests between two frames collapse into one drawing of the latest state.
function schedule() { if (!pending) { pending = true; setTimeout(render, 0); } }

self.onmessage = ({ data }) => {
  if (data.type === 'init') { canvas = data.canvas; ctx = canvas.getContext('2d'); return; }
  if (data.type === 'size') {
    size = { w: data.w, h: data.h };
    canvas.width = Math.max(1, Math.round(data.w * data.dpr));
    canvas.height = Math.max(1, Math.round(data.h * data.dpr));
    schedule();
    return;
  }
  if (data.type === 'draw') { state = { rotation: data.rotation, mode: data.mode }; schedule(); }
};
