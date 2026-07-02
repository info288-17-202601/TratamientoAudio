import { Audio } from '../../../models/audio.model';

const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 001.54.84l10-6.5a1 1 0 000-1.68l-10-6.5A1 1 0 008 5.5z"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const VOL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>';
const MUTE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

export function buildPopupTemplate(audio: Audio): string {
  const badgeColor = 'bg-red-100 text-red-800 border-red-200';

  return `
    <div class="p-4 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/80 font-sans min-w-[250px]">
      <div class="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
        <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Muestra Registrada</span>
        <span class="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600 font-semibold">#${audio.id}</span>
      </div>
      <div class="mb-3">
        <span class="text-xs text-slate-400 block mb-0.5">Intensidad Acústica</span>
        <div class="flex items-baseline space-x-1">
          <span class="text-2xl font-black tracking-tight text-slate-900">${audio.decibels}</span>
          <span class="text-xs font-bold text-slate-400">dB</span>
        </div>
      </div>
      <div class="space-y-2 pt-1">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500 font-medium">Origen:</span>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}">
            ${audio.categoria}
          </span>
        </div>
        ${audio.tipo_ave ? `
          <div class="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 p-2 rounded-xl mt-1">
            <span class="text-emerald-700 font-semibold" style="display:inline-flex;align-items:center;gap:4px">
              <svg style="width:12px;height:12px;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>
              Especie:
            </span>
            <span class="text-emerald-800 font-extrabold italic">${audio.tipo_ave}</span>
          </div>
        ` : ''}
      </div>
      <div class="mt-3 pt-2 border-t border-slate-100">
        <div class="popup-player" data-src="${audio.audioStreamUrl}">
          <button class="pp-play" type="button" aria-label="Reproducir">${PLAY_ICON}</button>
          <span class="pp-time"><span class="pp-current">0:00</span><span class="pp-total"> / 0:00</span></span>
          <input class="pp-seek" type="range" min="0" max="0" step="0.1" value="0" aria-label="Posición del audio">
          <button class="pp-mute" type="button" aria-label="Silenciar">${VOL_ICON}</button>
        </div>
      </div>
    </div>
  `;
}

// Conecta los controles del player del popup con un elemento <audio>.
// Devuelve una función de limpieza para llamar al cerrar el popup.
export function wirePopupPlayer(root: HTMLElement | null): () => void {
  const wrap = root?.querySelector<HTMLElement>('.popup-player');
  const playBtn = wrap?.querySelector<HTMLButtonElement>('.pp-play');
  const muteBtn = wrap?.querySelector<HTMLButtonElement>('.pp-mute');
  const seek = wrap?.querySelector<HTMLInputElement>('.pp-seek');
  const timeCur = wrap?.querySelector<HTMLElement>('.pp-current');
  const timeTot = wrap?.querySelector<HTMLElement>('.pp-total');
  if (!wrap || !playBtn || !muteBtn || !seek || !timeCur || !timeTot) {
    return () => undefined;
  }

  const audioEl = new window.Audio();
  audioEl.preload = 'none';
  audioEl.src = wrap.dataset['src'] ?? '';

  const fmt = (s: number): string => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  playBtn.addEventListener('click', () => {
    if (audioEl.paused) void audioEl.play();
    else audioEl.pause();
  });
  audioEl.addEventListener('play', () => { playBtn.innerHTML = PAUSE_ICON; });
  audioEl.addEventListener('pause', () => { playBtn.innerHTML = PLAY_ICON; });
  audioEl.addEventListener('loadedmetadata', () => {
    seek.max = String(audioEl.duration || 0);
    timeTot.textContent = ` / ${fmt(audioEl.duration)}`;
  });
  audioEl.addEventListener('timeupdate', () => {
    seek.value = String(audioEl.currentTime);
    timeCur.textContent = fmt(audioEl.currentTime);
  });
  audioEl.addEventListener('ended', () => { audioEl.currentTime = 0; });
  seek.addEventListener('input', () => {
    audioEl.currentTime = Number(seek.value);
  });
  muteBtn.addEventListener('click', () => {
    audioEl.muted = !audioEl.muted;
    muteBtn.innerHTML = audioEl.muted ? MUTE_ICON : VOL_ICON;
  });

  return () => {
    audioEl.pause();
    audioEl.src = '';
  };
}
