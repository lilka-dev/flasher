const GITHUB_REPO = 'lilka-dev/keira';
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
// Releases bundled into the site by the deploy workflow (same-origin .bin files)
const LOCAL_RELEASES_URL = 'firmware/releases.json';

// Loaded in the background; awaited only when the device is actually needed
const esptool = import('https://cdn.jsdelivr.net/npm/esptool-js@0.4.3/+esm');
esptool.catch(() => {});

const translations = {
  uk: {
    pageTitle: 'Lilka Flasher — оновлення прошивки',
    heroTitle: 'Прошивка Keira для Lilka',
    subtitle: 'Встановлення прямо з браузера — без додаткових програм.',
    step1: 'Підключіть Lilka до комп\'ютера USB-кабелем',
    step2: 'Натисніть «Встановити» біля потрібної версії та виберіть мову',
    step3: 'Натисніть «Підключити та прошити», виберіть порт і дочекайтеся завершення',
    note: 'Потрібен <strong>Chrome, Edge або Opera</strong>. Якщо порт не з\'являється — встановіть драйвер CH340/CP2102.',
    releasesTitle: 'Доступні версії',
    loading: 'Завантаження релізів...',
    latestVersionBadge: 'Остання',
    install: 'Встановити',
    changes: 'Що нового',
    noBinary: 'Немає .bin',
    unsupported: 'Браузер не підтримується',
    noReleases: 'Релізів поки немає. Перевірте {link}.',
    loadReleasesError: 'Помилка завантаження релізів: {message}. Спробуйте {link}.',
    githubLink: 'GitHub',
    eraseTitle: 'Очистити пристрій',
    eraseDescription: 'Повне стирання flash-пам\'яті ESP32. Видалить прошивку та всі дані.',
    eraseBtn: 'Стерти flash',
    eraseConfirm: 'Ви впевнені? Це повністю зітре flash-пам\'ять пристрою!',
    erasingFlash: 'Стирання flash-пам\'яті... Це може зайняти деякий час.',
    eraseSuccess: '✅ Flash-пам\'ять успішно стерто!',
    modalTitle: 'Прошивка',
    chooseLanguage: 'Мова прошивки',
    manualStep1: 'Крок 1: завантажте файл прошивки',
    manualStep2: 'Крок 2: виберіть завантажений файл',
    fileSelectDefault: '📁 Вибрати .bin файл',
    fileMustBeBin: 'Будь ласка, виберіть файл з розширенням .bin',
    flashBtn: 'Підключити та прошити',
    cancel: 'Скасувати',
    close: 'Закрити',
    retry: 'Спробувати знову',
    busy: 'Зачекайте...',
    flashingInProgressConfirm: 'Прошивка в процесі. Ви впевнені, що хочете скасувати?',
    serialNeedHttps: '⚠️ Web Serial API потребує HTTPS або localhost. Поточний протокол: {protocol}',
    serialUnsupported: '⚠️ Ваш браузер не підтримує Web Serial API. Використовуйте Chrome, Edge або Opera.',
    selectComPort: 'Виберіть COM-порт у діалоговому вікні...',
    downloadingFirmware: 'Завантаження прошивки...',
    fileSize: 'Розмір файлу: {size}',
    initEsp: 'Підключення до ESP32...',
    esptoolNotLoaded: 'ESPTool не завантажено. Оновіть сторінку.',
    chipDetected: 'Виявлено чіп: {chip}',
    writingProgress: 'Запис: {written} / {total}',
    restartingDevice: 'Перезапуск пристрою...',
    flashSuccess: '✅ Прошивка успішно завершена!',
    errorPrefix: '❌ Помилка: {message}'
  },
  en: {
    pageTitle: 'Lilka Flasher — firmware update',
    heroTitle: 'Keira firmware for Lilka',
    subtitle: 'Install right from your browser — no extra software needed.',
    step1: 'Connect Lilka to your computer with a USB cable',
    step2: 'Click "Install" next to a version and choose a language',
    step3: 'Click "Connect and flash", pick the port and wait until it finishes',
    note: 'Requires <strong>Chrome, Edge or Opera</strong>. If no port shows up, install the CH340/CP2102 driver.',
    releasesTitle: 'Available versions',
    loading: 'Loading releases...',
    latestVersionBadge: 'Latest',
    install: 'Install',
    changes: 'What\'s new',
    noBinary: 'No .bin',
    unsupported: 'Browser not supported',
    noReleases: 'No releases yet. Check {link}.',
    loadReleasesError: 'Failed to load releases: {message}. Try {link}.',
    githubLink: 'GitHub',
    eraseTitle: 'Erase device',
    eraseDescription: 'Full erase of the ESP32 flash. Removes the firmware and all data.',
    eraseBtn: 'Erase flash',
    eraseConfirm: 'Are you sure? This will completely erase the device flash memory!',
    erasingFlash: 'Erasing flash memory... This may take a while.',
    eraseSuccess: '✅ Flash memory erased successfully!',
    modalTitle: 'Flash',
    chooseLanguage: 'Firmware language',
    manualStep1: 'Step 1: download the firmware file',
    manualStep2: 'Step 2: select the downloaded file',
    fileSelectDefault: '📁 Choose .bin file',
    fileMustBeBin: 'Please choose a file with .bin extension',
    flashBtn: 'Connect and flash',
    cancel: 'Cancel',
    close: 'Close',
    retry: 'Try again',
    busy: 'Please wait...',
    flashingInProgressConfirm: 'Flashing is in progress. Are you sure you want to cancel?',
    serialNeedHttps: '⚠️ Web Serial API requires HTTPS or localhost. Current protocol: {protocol}',
    serialUnsupported: '⚠️ Your browser does not support Web Serial API. Use Chrome, Edge or Opera.',
    selectComPort: 'Select the COM port in the dialog...',
    downloadingFirmware: 'Downloading firmware...',
    fileSize: 'File size: {size}',
    initEsp: 'Connecting to ESP32...',
    esptoolNotLoaded: 'ESPTool not loaded. Please refresh the page.',
    chipDetected: 'Chip detected: {chip}',
    writingProgress: 'Writing: {written} / {total}',
    restartingDevice: 'Restarting device...',
    flashSuccess: '✅ Flashing completed successfully!',
    errorPrefix: '❌ Error: {message}'
  }
};

const LANG_FLAGS = {UK: '🇺🇦', UA: '🇺🇦', EN: '🇬🇧', DE: '🇩🇪', PL: '🇵🇱', ES: '🇪🇸', FR: '🇫🇷'};

let currentLanguage = 'uk';
let releases = [];
let busy = false;  // a serial operation is running

// Flash modal state
let firmwareOptions = [];
let selectedFirmware = null;
let firmwareData = null;  // Promise<Uint8Array> | null
let isLocalFirmware = false;

const $ = id => document.getElementById(id);
const releasesList = $('releasesList');
const flashModal = $('flashModal');
const flashBtn = $('flashBtn');
const cancelBtn = $('cancelBtn');
const eraseBtn = $('eraseBtn');
const fileInput = $('firmwareFile');
const fileInputText = $('fileInputText');

// --- i18n ---

function t(key, vars = {}) {
  const template = translations[currentLanguage][key] ?? translations.uk[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function applyTranslations() {
  document.title = t('pageTitle');
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-html]').forEach(el => el.innerHTML = t(el.dataset.i18nHtml));
  document.querySelectorAll('.lang-btn').forEach(
      btn => btn.classList.toggle('active', btn.dataset.lang === currentLanguage));

  if (!busy) {
    flashBtn.textContent = t('flashBtn');
    cancelBtn.textContent = t('cancel');
  }
  if (!fileInput.files.length) fileInputText.textContent = t('fileSelectDefault');
  if (flashModal.open) renderFirmwareOptions();

  checkWebSerialSupport();
  if (releases.length) renderReleases();
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLanguage = lang;
  try { localStorage.setItem('siteLanguage', lang); } catch {}
  applyTranslations();
}

// --- Helpers ---

function hasWebSerial() {
  return window.isSecureContext && 'serial' in navigator;
}

function checkWebSerialSupport() {
  const warning = $('browserWarning');
  if (!window.isSecureContext) {
    warning.textContent = t('serialNeedHttps', {protocol: location.protocol});
  } else if (!('serial' in navigator)) {
    warning.textContent = t('serialUnsupported');
  }
  warning.hidden = hasWebSerial();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(
      currentLanguage === 'en' ? 'en-US' : 'uk-UA',
      {year: 'numeric', month: 'long', day: 'numeric'});
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// GitHub release notes -> safe HTML: bullet lists, links shortened to "#123"
function renderNotes(markdown) {
  let html = '';
  let inList = false;
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    const item = line.match(/^[*-]\s+(.*)/);
    if (item && !inList) html += '<ul>';
    if (!item && inList) html += '</ul>';
    inList = !!item;
    if (!line) continue;

    const text = escapeHtml((item ? item[1] : line).replace(/^#+\s*/, ''))
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/https:\/\/\S+/g, url => {
          const issue = url.match(/\/(?:pull|issues)\/(\d+)$/);
          return `<a href="${url}" target="_blank" rel="noopener">${issue ? '#' + issue[1] : url}</a>`;
        });
    html += item ? `<li>${text}</li>` : `<p>${text}</p>`;
  }
  return inList ? html + '</ul>' : html;
}

// Merged images (bootloader + partitions + app) can be written at 0x0
function findFirmware(assets) {
  const bins = assets.filter(a => a.name.endsWith('.bin'));
  const merged = bins.filter(a => a.name.toLowerCase().includes('merged'));
  return merged.length ? merged :
      bins.filter(a => !/bootloader|partition/i.test(a.name));
}

function firmwareLabel(filename) {
  const code = filename.match(/LANG_([A-Z]+)/i)?.[1].toUpperCase();
  if (!code) return filename;
  let name = code;
  try {
    name = new Intl.DisplayNames([currentLanguage], {type: 'language'})
        .of(code === 'UA' ? 'uk' : code.toLowerCase());
    name = name[0].toUpperCase() + name.slice(1);
  } catch {}
  return `${LANG_FLAGS[code] ?? '🌐'} ${name}`;
}

// esptool-js 0.4 takes firmware as a binary string
function toBinaryString(bytes) {
  let result = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    result += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return result;
}

// --- Progress + log block (shared by flash and erase) ---

function createTask(root) {
  const fill = root.querySelector('.progress-fill');
  const text = root.querySelector('.progress-text');
  const logEl = root.querySelector('.flash-log');

  function log(message, type = '') {
    const p = document.createElement('p');
    p.textContent = message;
    p.className = type && `log-${type}`;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  }

  return {
    log,
    reset() {
      root.hidden = false;
      logEl.replaceChildren();
      this.progress(0, '');
    },
    hide() { root.hidden = true; },
    progress(percent, message, state = '') {
      fill.style.width = `${percent}%`;
      text.textContent = message;
      text.className = `progress-text ${state}`;
    },
    step(percent, message) {
      this.progress(percent, message);
      log(message);
    },
    // Output sink for esptool-js
    terminal: {
      clean() {},
      writeLine: data => log(data),
      write(data) {
        const last = logEl.lastElementChild;
        if (last) last.textContent += data; else log(data);
      }
    }
  };
}

const flashTask = createTask($('flashTask'));
const eraseTask = createTask($('eraseTask'));

// Asks for a port and connects to the chip. Must be called from a click handler.
async function withDevice(task, action) {
  if (!hasWebSerial()) {
    alert(t('serialUnsupported'));
    return false;
  }

  busy = true;
  let transport = null;
  try {
    task.log(t('selectComPort'));
    const port = await navigator.serial.requestPort();

    task.step(10, t('initEsp'));
    const {ESPLoader, Transport} = await esptool.catch(() => {
      throw new Error(t('esptoolNotLoaded'));
    });
    transport = new Transport(port);
    const loader = new ESPLoader({
      transport,
      baudrate: 115200,
      romBaudrate: 115200,
      terminal: task.terminal
    });
    await loader.main();
    task.log(t('chipDetected', {chip: loader.chipName}), 'success');

    await action(loader);

    task.step(95, t('restartingDevice'));
    await loader.hardReset();
    return true;
  } catch (error) {
    console.error(error);
    const message = t('errorPrefix', {message: error.message});
    task.log(message, 'error');
    task.progress(100, message, 'error');
    return false;
  } finally {
    busy = false;
    try { await transport?.disconnect(); } catch {}
  }
}

// --- Releases ---

function renderReleases() {
  if (!releases.length) {
    releasesList.innerHTML = `<div class="alert alert-error">${
        t('noReleases', {link: `<a href="${GITHUB_RELEASES_URL}" target="_blank">${t('githubLink')}</a>`})}</div>`;
    return;
  }

  releasesList.innerHTML = releases.map((release, index) => {
    const canInstall = findFirmware(release.assets).length > 0;
    const disabledText = !canInstall ? t('noBinary') : !hasWebSerial() ? t('unsupported') : '';
    const button = disabledText ?
        `<button class="btn btn-primary btn-sm" disabled>${disabledText}</button>` :
        `<button class="btn btn-primary btn-sm" data-install="${index}">⚡ ${t('install')}</button>`;
    const notes = release.body ?
        `<details class="release-notes"${index === 0 ? ' open' : ''}>
           <summary>${t('changes')}</summary>
           <div class="release-body">${renderNotes(release.body)}</div>
         </details>` : '';

    return `
      <article class="release-card${index === 0 ? ' latest' : ''}">
        <div class="release-header">
          <div class="release-info">
            <h3>
              <a href="${escapeHtml(release.html_url)}" target="_blank" rel="noopener">${escapeHtml(release.name || release.tag_name)}</a>
              ${index === 0 ? `<span class="badge">${t('latestVersionBadge')}</span>` : ''}
            </h3>
            <span class="release-date">${formatDate(release.published_at)}</span>
          </div>
          ${button}
        </div>
        ${notes}
      </article>`;
  }).join('');
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadReleases() {
  try {
    try {
      releases = await fetchJson(LOCAL_RELEASES_URL);
    } catch {
      // Not deployed by the workflow (e.g. local dev) - use GitHub directly
      releases = await fetchJson(GITHUB_API_URL);
    }
    renderReleases();
  } catch (error) {
    releasesList.innerHTML = `<div class="alert alert-error">${t('loadReleasesError', {
      message: escapeHtml(error.message),
      link: `<a href="${GITHUB_RELEASES_URL}" target="_blank">${t('githubLink')}</a>`
    })}</div>`;
  } finally {
    $('loading').hidden = true;
  }
}

// --- Flash modal ---

function renderFirmwareOptions() {
  $('firmwareLabel').textContent = t(isLocalFirmware ? 'chooseLanguage' : 'manualStep1');
  $('firmwareOptions').innerHTML = firmwareOptions.map((fw, index) => {
    const content = `<span>${firmwareLabel(fw.name)}</span><small>${formatSize(fw.size)}</small>`;
    return isLocalFirmware ?
        `<button type="button" class="fw-option${fw === selectedFirmware ? ' selected' : ''}" data-firmware="${index}">${content}</button>` :
        `<a class="fw-option" href="${escapeHtml(fw.browser_download_url)}" download>📥 ${content}</a>`;
  }).join('');
}

// Fetch bundled firmware in the background, so the port dialog can open
// right on click (it requires a fresh user gesture)
function selectFirmware(fw) {
  selectedFirmware = fw;
  firmwareData = fetch(fw.local_url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then(buffer => new Uint8Array(buffer));
  firmwareData.catch(() => {});  // reported when flashing starts
  renderFirmwareOptions();
}

function openFlashModal(release) {
  firmwareOptions = findFirmware(release.assets);
  // Firmware bundled by the deploy workflow can be fetched directly,
  // otherwise the user has to download it from GitHub and select it manually
  isLocalFirmware = firmwareOptions.every(fw => fw.local_url);
  firmwareData = null;

  $('flashVersion').textContent = release.tag_name;
  $('manualFile').hidden = isLocalFirmware;
  fileInput.value = '';
  fileInputText.textContent = t('fileSelectDefault');
  fileInputText.parentElement.classList.remove('selected');
  flashTask.hide();

  if (isLocalFirmware) selectFirmware(firmwareOptions[0]);
  else renderFirmwareOptions();

  flashBtn.disabled = !isLocalFirmware;
  flashBtn.textContent = t('flashBtn');
  cancelBtn.textContent = t('cancel');
  flashModal.showModal();
}

function closeFlashModal() {
  if (busy && !confirm(t('flashingInProgressConfirm'))) return;
  flashModal.close();
}

function onFileSelected() {
  const file = fileInput.files[0];
  fileInputText.parentElement.classList.toggle('selected', !!file);
  flashBtn.disabled = !file;
  firmwareData = null;
  if (!file) {
    fileInputText.textContent = t('fileSelectDefault');
    return;
  }
  if (!file.name.endsWith('.bin')) {
    alert(t('fileMustBeBin'));
    fileInput.value = '';
    onFileSelected();
    return;
  }
  fileInputText.textContent = `✅ ${file.name} (${formatSize(file.size)})`;
  firmwareData = file.arrayBuffer().then(buffer => new Uint8Array(buffer));
}

async function startFlash() {
  if (busy || !firmwareData) return;
  flashBtn.disabled = true;
  flashBtn.textContent = t('busy');
  flashTask.reset();

  const ok = await withDevice(flashTask, async loader => {
    flashTask.step(15, t('downloadingFirmware'));
    const data = await firmwareData;
    flashTask.log(t('fileSize', {size: formatSize(data.length)}));

    await loader.writeFlash({
      fileArray: [{data: toBinaryString(data), address: 0x0}],
      flashSize: 'keep',
      flashMode: 'keep',
      flashFreq: 'keep',
      eraseAll: false,
      compress: true,
      reportProgress: (_, written, total) => flashTask.progress(
          20 + Math.round((written / total) * 75),
          t('writingProgress', {written: formatSize(written), total: formatSize(total)}))
    });
  });

  if (ok) {
    flashTask.progress(100, t('flashSuccess'), 'success');
    flashTask.log(t('flashSuccess'), 'success');
    cancelBtn.textContent = t('close');
    flashBtn.textContent = t('flashBtn');
  } else {
    // A failed download is retried on the next attempt
    if (isLocalFirmware) selectFirmware(selectedFirmware);
    flashBtn.textContent = t('retry');
  }
  flashBtn.disabled = false;
}

// --- Erase ---

async function startErase() {
  if (busy || !confirm(t('eraseConfirm'))) return;
  eraseBtn.disabled = true;
  eraseTask.reset();

  const ok = await withDevice(eraseTask, async loader => {
    eraseTask.step(40, t('erasingFlash'));
    await loader.eraseFlash();
  });

  if (ok) {
    eraseTask.progress(100, t('eraseSuccess'), 'success');
    eraseTask.log(t('eraseSuccess'), 'success');
  }
  eraseBtn.disabled = false;
}

// --- Events ---

document.querySelectorAll('.lang-btn').forEach(
    btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));

releasesList.addEventListener('click', e => {
  const button = e.target.closest('[data-install]');
  if (button) openFlashModal(releases[button.dataset.install]);
});

$('firmwareOptions').addEventListener('click', e => {
  const option = e.target.closest('[data-firmware]');
  if (option && !busy) selectFirmware(firmwareOptions[option.dataset.firmware]);
});

flashModal.addEventListener('click', e => {
  // Backdrop click lands on the <dialog> element itself
  if (e.target === flashModal || e.target.closest('[data-action="close"]')) closeFlashModal();
});
flashModal.addEventListener('cancel', e => {
  e.preventDefault();
  closeFlashModal();
});

fileInput.addEventListener('change', onFileSelected);
flashBtn.addEventListener('click', startFlash);
eraseBtn.addEventListener('click', startErase);

// --- Init ---

let savedLanguage = null;
try { savedLanguage = localStorage.getItem('siteLanguage'); } catch {}
currentLanguage = translations[savedLanguage] ? savedLanguage :
    navigator.language.toLowerCase().startsWith('uk') ? 'uk' : 'en';

applyTranslations();
loadReleases();
