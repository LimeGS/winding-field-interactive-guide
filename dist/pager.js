// Book-style navigation. Every .page fills one screen; a bar fixed to the
// bottom of the window carries Back, the chapter index with progress, and Next.
// Extra material (notebooks, glossary terms, credits) opens in place as a
// panel, so nothing ever sends the reader to another part of the guide.

import { t } from './i18n.js?v=20261125-steps';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let sheet;
function ensureSheet() {
  if (sheet) return sheet;
  sheet = document.createElement('dialog');
  sheet.className = 'sheet';
  sheet.innerHTML = '<div class="sheet-head"><h3 class="sheet-title" id="sheet-title"></h3><button type="button" class="sheet-close" aria-label="Close panel">✕</button></div><div class="sheet-body"></div>';
  sheet.setAttribute('aria-labelledby', 'sheet-title');
  document.body.append(sheet);
  sheet.querySelector('.sheet-close').addEventListener('click', () => sheet.close());
  // A click on the backdrop (the dialog element itself) closes the panel.
  sheet.addEventListener('click', event => { if (event.target === sheet) sheet.close(); });
  sheet.addEventListener('close', () => {
    if (sheet.restore) { sheet.restore(); sheet.restore = null; }
    sheet.querySelector('.sheet-body').replaceChildren();
  });
  return sheet;
}

function openSheet(title, nodes, { restore = null, wide = false } = {}) {
  const dialog = ensureSheet();
  if (dialog.open) dialog.close();
  dialog.classList.toggle('sheet-wide', wide);
  dialog.querySelector('.sheet-title').textContent = title;
  const body = dialog.querySelector('.sheet-body');
  body.replaceChildren(...nodes);
  dialog.restore = restore;
  dialog.showModal();
  body.scrollTop = 0;
}

function summaryTitle(summary) {
  const copy = summary.cloneNode(true);
  copy.querySelectorAll('span').forEach(span => { if (span.textContent.trim() === '+') span.remove(); });
  return copy.textContent.trim();
}

function initPanels() {
  document.addEventListener('click', event => {
    const term = event.target.closest('[data-glossary]');
    if (term) {
      const entry = document.getElementById(`term-${term.dataset.glossary}`);
      if (!entry) return;
      event.preventDefault();
      const body = [...entry.children].filter(el => !/^H\d$/.test(el.tagName)).map(el => el.cloneNode(true));
      openSheet(entry.querySelector('h4')?.textContent.trim() || term.textContent.trim(), body);
      return;
    }
    const summary = event.target.closest('summary');
    if (!summary) return;
    const details = summary.parentElement;
    if (!details || details.tagName !== 'DETAILS' || !details.closest('.page')) return;
    event.preventDefault();
    const moved = [...details.children].filter(el => el !== summary);
    openSheet(summaryTitle(summary), moved, {
      wide: details.matches('.deep-dive, .solver-values-details, .credits'),
      restore: () => details.append(...moved)
    });
  });
}

export function initPager() {
  const pages = [...document.querySelectorAll('.page')];
  if (!pages.length) return;
  initPanels();

  const chapters = [];
  pages.forEach((page, index) => {
    let chapter = chapters.find(item => item.key === page.dataset.chapter);
    if (!chapter) {
      chapter = { key: page.dataset.chapter, num: page.dataset.chapterNum || '', name: page.dataset.chapterName || '', pages: [] };
      chapters.push(chapter);
    }
    chapter.pages.push(index);
  });
  const chapterOf = index => chapters.findIndex(chapter => chapter.pages.includes(index));

  const nav = document.createElement('nav');
  nav.className = 'pager';
  nav.setAttribute('aria-label', 'Guide navigation');
  nav.innerHTML = `
    <div class="pager-progress" aria-hidden="true"><i></i></div>
    <button type="button" class="pager-btn pager-back" disabled><span aria-hidden="true">←</span><span class="pager-btn-label">Back</span></button>
    <ol class="pager-index">${chapters.map((chapter, i) => `<li><a href="#${pages[chapter.pages[0]].id}" data-chapter-index="${i}"><span class="pager-label">${chapter.num ? `<span class="pager-num">${chapter.num}</span>` : ''}<span class="pager-name">${chapter.name}</span></span><span class="pager-dots" aria-hidden="true">${chapter.pages.map(() => '<i></i>').join('')}</span></a></li>`).join('')}</ol>
    <button type="button" class="pager-here" aria-haspopup="dialog"></button>
    <button type="button" class="pager-btn pager-next"><span class="pager-next-text"><span class="pager-btn-label">Next</span><span class="pager-next-title"></span></span><span class="pager-next-icon" aria-hidden="true">→</span></button>
    <span class="pager-status" role="status" aria-live="polite"></span>`;
  document.body.append(nav);

  const back = nav.querySelector('.pager-back');
  const next = nav.querySelector('.pager-next');
  const here = nav.querySelector('.pager-here');
  const status = nav.querySelector('.pager-status');
  const bar = nav.querySelector('.pager-progress i');
  const links = [...nav.querySelectorAll('.pager-index a')];
  let current = -1;

  // A page being turned to; kept briefly so a layout change mid-move can re-aim.
  let heading = null, headingTimer = 0;
  function go(index) {
    const target = pages[Math.max(0, Math.min(pages.length - 1, index))];
    heading = target; clearTimeout(headingTimer); headingTimer = setTimeout(() => { heading = null; }, 1500);
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  // A page can hold numbered steps (a tablist marked data-pager-steps). Next and Back
  // walk those steps first and turn the page only after the last (or before the first).
  const clean = node => node.textContent.replace(/\s+/g, ' ').trim();
  function stepsOf(index) {
    const list = pages[index] && pages[index].querySelector('[data-pager-steps]');
    const tabs = list ? [...list.querySelectorAll('[role="tab"]')] : [];
    if (tabs.length < 2) return null;
    return { tabs, at: Math.max(0, tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true')) };
  }
  function advance(direction) {
    const steps = stepsOf(current);
    const to = steps ? steps.at + direction : -1;
    if (steps && to >= 0 && to < steps.tabs.length) {
      steps.tabs[to].click();
      // On a tall page read further down, bring the steps back into view.
      const list = steps.tabs[to].closest('[data-pager-steps]');
      if (list.getBoundingClientRect().top < 0) list.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    const target = direction > 0 && current === pages.length - 1 ? 0 : current + direction;
    if (target < 0 || target >= pages.length) return;
    go(target);
    // Arriving forwards starts at step 1; coming back lands on the last step.
    const arriving = stepsOf(target);
    if (arriving) arriving.tabs[direction > 0 ? 0 : arriving.tabs.length - 1].click();
  }

  function measure() {
    const line = window.innerHeight * 0.4;
    let found = 0;
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].getBoundingClientRect().top <= line) found = i; else break;
    }
    return found;
  }

  function update(force = false) {
    const index = measure();
    if (index === current && !force) return;
    current = index;
    const page = pages[index];
    const chapterIndex = chapterOf(index);
    const chapter = chapters[chapterIndex];
    const within = chapter.pages.indexOf(index);
    const last = index === pages.length - 1;

    const steps = stepsOf(index);
    const nextStep = steps && steps.at < steps.tabs.length - 1 ? clean(steps.tabs[steps.at + 1]) : '';
    const backStep = steps && steps.at > 0 ? clean(steps.tabs[steps.at - 1]) : '';
    const restart = last && !nextStep;
    back.disabled = index === 0 && !backStep;
    next.classList.toggle('pager-restart', restart);
    const nextLabel = restart ? 'Start over' : index === 0 && !nextStep ? 'Start reading' : 'Next';
    next.querySelector('.pager-btn-label').textContent = nextLabel;
    // Step names come from the tabs, already in the page's language.
    next.querySelector('.pager-next-title').textContent = nextStep || (restart ? '' : pages[index + 1].dataset.title || '');
    next.querySelector('.pager-next-icon').textContent = restart ? '↺' : '→';
    // Accessible names start with the visible words, so voice control matches them.
    next.setAttribute('aria-label', restart ? t('Start over') : `${t(nextLabel)}: ${nextStep || t(pages[index + 1].dataset.title)}`);
    back.setAttribute('aria-label', backStep ? `${t('Back')}: ${backStep}` : index === 0 ? t('Back') : `${t('Back')}: ${t(pages[index - 1].dataset.title)}`);

    links.forEach((link, i) => {
      const active = i === chapterIndex;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
      [...link.querySelectorAll('.pager-dots i')].forEach((dot, k) => {
        dot.className = i < chapterIndex || (active && k < within) ? 'done' : active && k === within ? 'now' : '';
      });
    });
    bar.style.transform = `scaleX(${(index + 1) / pages.length})`;
    const label = `${chapter.num ? `${chapter.num} ` : ''}${chapter.name}`;
    here.innerHTML = `<span class="pager-here-chapter">${label}</span> <span class="pager-here-count">${index + 1} / ${pages.length}</span>`;
    here.setAttribute('aria-label', `${chapter.num ? `${chapter.num} ` : ''}${t(chapter.name)} ${index + 1} / ${pages.length}. ${t('Contents')}: ${t(page.dataset.title)}`);
    status.textContent = `${t('Page')} ${index + 1} / ${pages.length}. ${t(chapter.name)}: ${t(page.dataset.title)}`;
    document.documentElement.dataset.page = page.id;
    if (window.location.hash !== `#${page.id}` && (index > 0 || window.location.hash)) {
      history.replaceState(null, '', index === 0 ? window.location.pathname + window.location.search : `#${page.id}`);
    }
  }

  // Experiments build themselves as the reader approaches, which can change the
  // height of pages above the one being read. Keep the page being read still.
  let anchor = null;
  const remember = () => { const page = pages[measure()]; anchor = { page, top: page.getBoundingClientRect().top, y: window.scrollY }; };
  if (typeof ResizeObserver !== 'undefined') {
    const keepPlace = new ResizeObserver(() => {
      if (heading) { heading.scrollIntoView({ behavior: 'auto', block: 'start' }); remember(); return; }
      if (!anchor) return;
      // The window moved since the place was noted (a jump or a scroll): note it again instead.
      if (Math.abs(window.scrollY - anchor.y) > 1) { remember(); return; }
      const shift = anchor.page.getBoundingClientRect().top - anchor.top;
      if (Math.abs(shift) > 1) { window.scrollBy({ top: shift, behavior: 'instant' }); anchor.y = window.scrollY; }
    });
    pages.forEach(page => keepPlace.observe(page));
  }

  let pending = false;
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; remember(); update(); }); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });

  back.addEventListener('click', () => advance(-1));
  next.addEventListener('click', () => advance(1));
  // A step chosen any way (tab, keys, Next) relabels Next and Back.
  new MutationObserver(records => {
    if (records.some(record => record.target.closest('[data-pager-steps]'))) update(true);
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
  links.forEach((link, i) => link.addEventListener('click', event => { event.preventDefault(); go(chapters[i].pages[0]); }));

  // In-page links to a page or chapter use the same smooth, snapped move.
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || anchor.closest('.pager') || event.defaultPrevented) return;
    const target = document.getElementById(anchor.getAttribute('href').slice(1));
    const page = target && (target.matches('.page') ? target : target.querySelector('.page') || target.closest('.page'));
    if (!page) return;
    event.preventDefault();
    go(pages.indexOf(page));
  });

  // Contents panel (the only index on small screens).
  here.addEventListener('click', () => {
    const list = document.createElement('ol');
    list.className = 'contents';
    chapters.forEach(chapter => {
      const item = document.createElement('li');
      item.innerHTML = `<span class="contents-chapter">${chapter.num ? `<span class="pager-num">${chapter.num}</span>` : ''}${chapter.name}</span>`;
      const sub = document.createElement('ol');
      chapter.pages.forEach(index => {
        const entry = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = pages[index].dataset.title;
        if (index === current) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => { sheet.close(); go(index); });
        entry.append(button);
        sub.append(entry);
      });
      item.append(sub);
      list.append(item);
    });
    openSheet(t('Contents'), [list]);
  });

  // Left/right arrows turn the page unless a control that uses them has focus.
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    if (sheet && sheet.open) return;
    const focus = document.activeElement;
    if (focus && focus !== document.body && focus.closest('input, select, textarea, canvas, [role="tab"], [role="slider"], [contenteditable], [tabindex="0"]')) return;
    event.preventDefault();
    advance(event.key === 'ArrowRight' ? 1 : -1);
  });

  // First measurement waits for layout to settle instead of forcing it during start-up.
  // A changed link (#chapter) aims at its page the same way as a link on load.
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(window.location.hash.slice(1));
    const page = target && (target.matches('.page') ? target : target.querySelector('.page') || target.closest('.page'));
    if (page) go(pages.indexOf(page));
  });

  // A link to a page: the browser jumps before scripts and translation finish
  // laying out the pages above it, so aim at it again while the layout settles.
  const linked = window.location.hash && document.getElementById(window.location.hash.slice(1));
  const linkedPage = linked && (linked.matches('.page') ? linked : linked.querySelector('.page') || linked.closest('.page'));
  if (linkedPage) {
    heading = linkedPage; clearTimeout(headingTimer); headingTimer = setTimeout(() => { heading = null; }, 2500);
    linkedPage.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  requestAnimationFrame(() => { if (linkedPage) linkedPage.scrollIntoView({ behavior: 'auto', block: 'start' }); remember(); update(); });
}
