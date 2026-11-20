// Before/after slider for the real CT slice in the opening section.
export function initColdOpen() {
  const stage = document.querySelector('.ct-compare-stage');
  const range = document.getElementById('ct-compare-range');
  if (!stage || !range) return;
  const update = () => stage.style.setProperty('--reveal', `${range.value}%`);
  range.addEventListener('input', update);
  update();
}
