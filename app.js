// GitHub API configuration
const GITHUB_REPO = 'lilka-dev/keira';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

// ESP32 flash configuration
const ESP32_FLASH_CONFIG = {
  flashSize: '16MB',
  flashMode: 'dio',
  flashFreq: '80m'
};

// Current flash state
let currentFirmware = null;
let currentVersion = null;
let selectedFileData = null;
let espLoaderTerminal = null;
let port = null;
let isFlashing = false;
let releasesCache = [];
let currentLanguage = 'uk';

const translations = {
  uk: {
    pageTitle: 'Lilka Flasher - Оновлення прошивки',
    subtitle: 'Оновлення прошивки Keira для Lilka',
    instructionsTitle: '📖 Інструкція',
    instruction1: 'Підключіть Lilka до комп\'ютера через USB-кабель',
    instruction2: 'Виберіть версію прошивки зі списку нижче та натисніть "Встановити"',
    instruction3: 'Завантажте файл прошивки (.bin) натиснувши кнопку "Завантажити"',
    instruction4: 'Виберіть завантажений файл через "Вибрати .bin файл" (причина цієї подвійної роботи в системі безпеки браузера і GitHub)',
    instruction5: 'Натисніть "Підключити та прошити" і виберіть COM-порт',
    instruction6: 'Дочекайтеся завершення прошивки',
    instructionsNoteHtml: '<strong>Примітка:</strong> Якщо порт не з\'являється, можливо потрібно встановити драйвер CH340/CP2102. Переконайтеся, що ви використовуєте <strong>Chrome, Edge або Opera</strong> — інші браузери не підтримують Web Serial API.',
    eraseTitle: '🗑️ Очистити пристрій',
    eraseDescription: 'Повне стирання flash-пам\'яті ESP32. Це видалить прошивку та всі дані з пристрою.',
    eraseBtnDefault: '🗑️ Стерти flash',
    eraseReady: 'Готово до стирання',
    releasesTitle: '📦 Доступні версії',
    browserWarningDefault: '⚠️ Web Serial API підтримується тільки в Chrome, Edge та Opera. Будь ласка, використовуйте один з цих браузерів.',
    loading: 'Завантаження релізів...',
    modalTitle: '⚡ Прошивка Lilka',
    versionLabel: 'Версія:',
    flashStep1: 'Крок 1: Завантажте файл прошивки',
    flashStep2: 'Крок 2: Виберіть завантажений файл',
    fileSelectDefault: '📁 Вибрати .bin файл',
    flashReady: 'Готово до прошивки',
    flashBtnDefault: '🔌 Підключити та прошити',
    cancel: 'Скасувати',
    serialNeedHttps: '⚠️ Web Serial API потребує HTTPS або localhost. Поточний протокол: {protocol}',
    serialUnsupported: '⚠️ Ваш браузер не підтримує Web Serial API. Використовуйте Chrome 89+, Edge 89+ або Opera 75+.',
    fileMustBeBin: 'Будь ласка, виберіть файл з розширенням .bin',
    fileReadError: 'Помилка читання файлу',
    flashingInProgressConfirm: 'Прошивка в процесі. Ви впевнені, що хочете скасувати?',
    flashSelectFileFirst: 'Помилка: спочатку виберіть файл прошивки',
    flashInProgress: 'Прошивка...',
    flashStart: '=== Початок прошивки ===',
    fileSize: 'Розмір файлу: {size}',
    connectToDevice: 'Підключення до пристрою...',
    selectComPort: 'Виберіть COM-порт у діалоговому вікні...',
    portSelected: 'Порт вибрано!',
    initEsp: 'Ініціалізація ESP32...',
    esptoolNotLoaded: 'ESPTool не завантажено. Будь ласка, оновіть сторінку.',
    bootloaderMode: 'Перехід в режим завантажувача...',
    chipDetected: 'Виявлено чіп: {chip}',
    preparingWrite: 'Підготовка до запису...',
    writingFirmware: 'Запис прошивки...',
    writingProgress: 'Запис: {written} / {total}',
    restartingDevice: 'Перезапуск пристрою...',
    flashSuccess: '✅ Прошивка успішно завершена!',
    flashDoneLog: '=== Прошивка успішно завершена! ===',
    done: '✅ Готово!',
    close: 'Закрити',
    retry: '🔄 Спробувати знову',
    errorPrefix: 'Помилка: {message}',
    install: '⚡ Встановити',
    browserNotSupported: 'Браузер не підтримується',
    browserNoWebSerialTitle: 'Браузер не підтримує Web Serial',
    binaryNotFound: 'Бінарний файл не знайдено',
    latestVersionBadge: 'Остання версія',
    noReleases: 'Релізів поки немає. Перевірте {link}.',
    githubRepo: 'GitHub репозиторій',
    loadReleasesError: 'Помилка завантаження релізів: {message}',
    openGithubDirectly: 'відкрити GitHub напряму',
    tryOpenDirectly: 'Спробуйте {link}.',
    eraseConfirm: 'Ви впевнені? Це повністю зітре flash-пам\'ять пристрою!',
    erasing: 'Стирання...',
    erasingFlash: 'Стирання flash-пам\'яті...',
    erasingMayTakeTime: 'Стирання flash-пам\'яті... Це може зайняти деякий час.',
    eraseSuccess: '✅ Flash-пам\'ять успішно стерто!',
    eraseSuccessLog: '=== Flash-пам\'ять успішно стерто! ===',
    fileSelected: 'Файл вибрано: {name} ({size})'
  },
  en: {
    pageTitle: 'Lilka Flasher - Firmware Update',
    subtitle: 'Keira firmware update for Lilka',
    instructionsTitle: '📖 Instructions',
    instruction1: 'Connect Lilka to your computer via USB cable',
    instruction2: 'Choose a firmware version below and click "Install"',
    instruction3: 'Download the firmware file (.bin) by clicking "Download"',
    instruction4: 'Select the downloaded file with "Choose .bin file" (this double step is required by browser and GitHub security restrictions)',
    instruction5: 'Click "Connect and Flash" and select a COM port',
    instruction6: 'Wait until flashing is complete',
    instructionsNoteHtml: '<strong>Note:</strong> If no port appears, you may need CH340/CP2102 drivers. Make sure you use <strong>Chrome, Edge, or Opera</strong> — other browsers do not support Web Serial API.',
    eraseTitle: '🗑️ Erase device',
    eraseDescription: 'Full erase of ESP32 flash memory. This will remove firmware and all data from the device.',
    eraseBtnDefault: '🗑️ Erase flash',
    eraseReady: 'Ready to erase',
    releasesTitle: '📦 Available versions',
    browserWarningDefault: '⚠️ Web Serial API is supported only in Chrome, Edge, and Opera. Please use one of these browsers.',
    loading: 'Loading releases...',
    modalTitle: '⚡ Flash Lilka',
    versionLabel: 'Version:',
    flashStep1: 'Step 1: Download firmware file',
    flashStep2: 'Step 2: Select downloaded file',
    fileSelectDefault: '📁 Choose .bin file',
    flashReady: 'Ready to flash',
    flashBtnDefault: '🔌 Connect and Flash',
    cancel: 'Cancel',
    serialNeedHttps: '⚠️ Web Serial API requires HTTPS or localhost. Current protocol: {protocol}',
    serialUnsupported: '⚠️ Your browser does not support Web Serial API. Use Chrome 89+, Edge 89+, or Opera 75+.',
    fileMustBeBin: 'Please choose a file with .bin extension',
    fileReadError: 'File read error',
    flashingInProgressConfirm: 'Flashing is in progress. Are you sure you want to cancel?',
    flashSelectFileFirst: 'Error: select firmware file first',
    flashInProgress: 'Flashing...',
    flashStart: '=== Flashing started ===',
    fileSize: 'File size: {size}',
    connectToDevice: 'Connecting to device...',
    selectComPort: 'Select COM port in the dialog...',
    portSelected: 'Port selected!',
    initEsp: 'Initializing ESP32...',
    esptoolNotLoaded: 'ESPTool not loaded. Please refresh the page.',
    bootloaderMode: 'Switching to bootloader mode...',
    chipDetected: 'Chip detected: {chip}',
    preparingWrite: 'Preparing to write...',
    writingFirmware: 'Writing firmware...',
    writingProgress: 'Writing: {written} / {total}',
    restartingDevice: 'Restarting device...',
    flashSuccess: '✅ Flashing completed successfully!',
    flashDoneLog: '=== Flashing completed successfully! ===',
    done: '✅ Done!',
    close: 'Close',
    retry: '🔄 Try again',
    errorPrefix: 'Error: {message}',
    install: '⚡ Install',
    browserNotSupported: 'Browser not supported',
    browserNoWebSerialTitle: 'Browser does not support Web Serial',
    binaryNotFound: 'Binary file not found',
    latestVersionBadge: 'Latest version',
    noReleases: 'No releases yet. Check {link}.',
    githubRepo: 'GitHub repository',
    loadReleasesError: 'Failed to load releases: {message}',
    openGithubDirectly: 'open GitHub directly',
    tryOpenDirectly: 'Try to {link}.',
    eraseConfirm: 'Are you sure? This will completely erase device flash memory!',
    erasing: 'Erasing...',
    erasingFlash: 'Erasing flash memory...',
    erasingMayTakeTime: 'Erasing flash memory... This may take some time.',
    eraseSuccess: '✅ Flash memory erased successfully!',
    eraseSuccessLog: '=== Flash memory erased successfully! ===',
    fileSelected: 'File selected: {name} ({size})'
  }
};

function t(key, vars = {}) {
  const dict = translations[currentLanguage] || translations.uk;
  const fallback = translations.uk[key] || key;
  const template = dict[key] || fallback;
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function setText(id, key) {
  const element = document.getElementById(id);
  if (element) element.textContent = t(key);
}

function updateLanguageButtons() {
  const ukBtn = document.getElementById('langUkBtn');
  const enBtn = document.getElementById('langEnBtn');
  if (ukBtn) ukBtn.classList.toggle('active', currentLanguage === 'uk');
  if (enBtn) enBtn.classList.toggle('active', currentLanguage === 'en');
}

function applyTranslations() {
  document.title = t('pageTitle');
  document.documentElement.lang = currentLanguage;

  setText('subtitleText', 'subtitle');
  setText('instructionsTitle', 'instructionsTitle');
  setText('instruction1', 'instruction1');
  setText('instruction2', 'instruction2');
  setText('instruction3', 'instruction3');
  setText('instruction4', 'instruction4');
  setText('instruction5', 'instruction5');
  setText('instruction6', 'instruction6');
  setText('eraseTitle', 'eraseTitle');
  setText('eraseDescription', 'eraseDescription');
  setText('releasesTitle', 'releasesTitle');
  setText('browserWarningText', 'browserWarningDefault');
  setText('loadingText', 'loading');
  setText('flashModalTitle', 'modalTitle');
  setText('flashVersionLabel', 'versionLabel');
  setText('flashStep1', 'flashStep1');
  setText('flashStep2', 'flashStep2');

  const note = document.getElementById('instructionsNote');
  if (note) note.innerHTML = t('instructionsNoteHtml');

  if (!selectedFileData) {
    fileInputText.textContent = t('fileSelectDefault');
  }

  if (!isFlashing) {
    flashBtn.textContent = t('flashBtnDefault');
    cancelBtn.textContent = t('cancel');
  }

  const eraseBtn = document.getElementById('eraseBtn');
  if (eraseBtn && eraseBtn.textContent !== t('erasing')) {
    eraseBtn.textContent = t('eraseBtnDefault');
  }

  const eraseProgressText = document.getElementById('eraseProgressText');
  if (eraseProgressText && !eraseProgressText.textContent.includes('✅') &&
      !eraseProgressText.textContent.includes('❌')) {
    eraseProgressText.textContent = t('eraseReady');
  }

  updateLanguageButtons();

  if (releasesCache.length > 0) {
    renderReleases();
  }
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLanguage = lang;
  localStorage.setItem('siteLanguage', lang);
  applyTranslations();
  checkWebSerialSupport();
}

window.setLanguage = setLanguage;

// DOM elements
const releasesList = document.getElementById('releasesList');
const loadingEl = document.getElementById('loading');
const browserWarning = document.getElementById('browserWarning');
const flashModal = document.getElementById('flashModal');
const flashVersion = document.getElementById('flashVersion');
const downloadLink = document.getElementById('downloadLink');
const downloadFileName = document.getElementById('downloadFileName');
const firmwareFileInput = document.getElementById('firmwareFile');
const fileInputText = document.getElementById('fileInputText');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const flashProgress = document.getElementById('flashProgress');
const flashLog = document.getElementById('flashLog');
const flashBtn = document.getElementById('flashBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Check Web Serial API support
function checkWebSerialSupport() {
  const isSecureContext = window.isSecureContext;
  const hasSerial = 'serial' in navigator;

  console.log('Secure context:', isSecureContext);
  console.log('Has serial:', hasSerial);
  console.log('Protocol:', window.location.protocol);

  if (!isSecureContext) {
    browserWarning.innerHTML =
        `<p>${t('serialNeedHttps', {protocol: window.location.protocol})}</p>`;
    browserWarning.style.display = 'block';
    return false;
  }

  if (!hasSerial) {
    browserWarning.innerHTML = `<p>${t('serialUnsupported')}</p>`;
    browserWarning.style.display = 'block';
    return false;
  }

  browserWarning.style.display = 'none';

  return true;
}

// Format date by selected locale
function formatDate(dateString) {
  const date = new Date(dateString);
  const locale = currentLanguage === 'en' ? 'en-US' : 'uk-UA';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format file size
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Parse release body (markdown) to simple text
function parseMarkdown(text) {
  if (!text) return '';
  return text.replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .substring(0, 500);
}

// Find firmware binary in release assets
function findFirmwareBinary(assets) {
  // Priority: merged binary > firmware.bin > any .bin
  const priorities = [
    a => a.name.toLowerCase().includes('merged') && a.name.endsWith('.bin'),
    a => a.name.toLowerCase() === 'firmware.bin',
    a => a.name.toLowerCase().includes('keira') && a.name.endsWith('.bin'),
    a => a.name.endsWith('.bin') && !a.name.includes('bootloader') &&
        !a.name.includes('partition')
  ];

  for (const check of priorities) {
    const found = assets.find(check);
    if (found) return found;
  }

  return assets.find(a => a.name.endsWith('.bin'));
}

// Find all merged firmware files (different languages)
function findAllMergedFirmware(assets) {
  const merged = assets.filter(
      a => a.name.toLowerCase().includes('merged') && a.name.endsWith('.bin'));

  if (merged.length > 0) return merged;

  // Fallback to any .bin file
  return assets.filter(
      a => a.name.endsWith('.bin') && !a.name.includes('bootloader') &&
          !a.name.includes('partition'));
}

// Get language name from filename
function getLangFromFilename(filename) {
  const match = filename.match(/LANG_(\w+)/i);
  if (match) {
    const lang = match[1].toUpperCase();
    const langNames = currentLanguage === 'en' ? {
      'UK': '🇺🇦 Ukrainian',
      'UA': '🇺🇦 Ukrainian',
      'EN': '🇬🇧 English',
      'DE': '🇩🇪 German',
      'PL': '🇵🇱 Polish',
      'ES': '🇪🇸 Spanish',
      'FR': '🇫🇷 French',
    } : {
      'UK': '🇺🇦 Українська',
      'UA': '🇺🇦 Українська',
      'EN': '🇬🇧 English',
      'DE': '🇩🇪 Deutsch',
      'PL': '🇵🇱 Polski',
      'ES': '🇪🇸 Español',
      'FR': '🇫🇷 Français',
    };
    return langNames[lang] || lang;
  }
  return filename;
}

// Logging functions
function log(message, type = 'info') {
  const p = document.createElement('p');
  p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  p.className = `log-${type}`;
  flashLog.appendChild(p);
  flashLog.scrollTop = flashLog.scrollHeight;
  console.log(`[${type}] ${message}`);
}

function clearLog() {
  flashLog.innerHTML = '';
}

function updateProgress(percent, text) {
  progressFill.style.width = `${percent}%`;
  if (text) {
    progressText.textContent = text;
    progressText.className = 'progress-text';
  }
}

function setProgressState(state, text) {
  progressText.textContent = text;
  progressText.className = `progress-text ${state}`;
}

// Modal functions
let currentFirmwareOptions = [];

function openFlashModal(version, firmwareList) {
  currentVersion = version;
  currentFirmwareOptions = firmwareList;
  currentFirmware = firmwareList[0];
  selectedFileData = null;

  flashVersion.textContent = version;

  // Build firmware options HTML
  const firmwareOptionsEl = document.getElementById('firmwareOptions');
  firmwareOptionsEl.innerHTML =
      firmwareList
          .map((fw, index) => {
            const langName = getLangFromFilename(fw.name);
            const isFirst = index === 0;
            return `
      <a href="${fw.browser_download_url}" class="btn btn-download ${
                isFirst ? 'recommended' : ''}" download>
        📥 ${langName}
        <span class="file-size">${formatSize(fw.size)}</span>
      </a>
    `;
          })
          .join('');

  // Reset file input
  firmwareFileInput.value = '';
  fileInputText.textContent = t('fileSelectDefault');
  fileInputText.classList.remove('selected');

  clearLog();
  flashLog.classList.remove('active');
  flashProgress.style.display = 'none';
  updateProgress(0, t('flashReady'));

  flashBtn.disabled = true;
  flashBtn.textContent = t('flashBtnDefault');
  cancelBtn.textContent = t('cancel');

  flashModal.classList.add('active');
}

// Handle file selection
function onFileSelected(input) {
  const file = input.files[0];
  if (!file) {
    selectedFileData = null;
    fileInputText.textContent = t('fileSelectDefault');
    fileInputText.classList.remove('selected');
    flashBtn.disabled = true;
    return;
  }

  if (!file.name.endsWith('.bin')) {
    alert(t('fileMustBeBin'));
    input.value = '';
    return;
  }

  fileInputText.textContent = `✅ ${file.name}`;
  fileInputText.classList.add('selected');

  // Read file
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedFileData = new Uint8Array(e.target.result);
    flashBtn.disabled = false;
    log(
        t(
            'fileSelected',
            {name: file.name, size: formatSize(selectedFileData.length)}),
        'success');
    flashLog.classList.add('active');
  };
  reader.onerror = () => {
    alert(t('fileReadError'));
    selectedFileData = null;
    flashBtn.disabled = true;
  };
  reader.readAsArrayBuffer(file);
}

function closeFlashModal() {
  if (isFlashing) {
    if (!confirm(t('flashingInProgressConfirm'))) {
      return;
    }
  }

  flashModal.classList.remove('active');

  // Disconnect port if connected
  if (port) {
    try {
      port.close();
    } catch (e) {
      console.error('Error closing port:', e);
    }
    port = null;
  }

  isFlashing = false;
  currentFirmware = null;
  currentVersion = null;
  selectedFileData = null;
}

// ESP Terminal class for esptool-js
class EspTerminal {
  clean() {
    // Clear terminal
  }

  writeLine(data) {
    log(data);
  }

  write(data) {
    // For continuous output
    const lastP = flashLog.lastElementChild;
    if (lastP && !lastP.textContent.includes('[')) {
      lastP.textContent += data;
    } else {
      const p = document.createElement('p');
      p.textContent = data;
      flashLog.appendChild(p);
    }
    flashLog.scrollTop = flashLog.scrollHeight;
  }
}

// Start flashing process
async function startFlash() {
  if (!selectedFileData) {
    alert(t('flashSelectFileFirst'));
    return;
  }

  if (!('serial' in navigator)) {
    alert(t('serialUnsupported'));
    return;
  }

  isFlashing = true;
  flashBtn.disabled = true;
  flashBtn.textContent = t('flashInProgress');
  flashLog.classList.add('active');
  flashProgress.style.display = 'block';

  try {
    log(t('flashStart'), 'info');
    log(t('fileSize', {size: formatSize(selectedFileData.length)}), 'info');

    // Step 1: Connect to serial port
    updateProgress(10, t('connectToDevice'));
    log(t('selectComPort'));

    port = await navigator.serial.requestPort();
    // Don't open port manually - esptool-js Transport handles it

    log(t('portSelected'), 'success');

    // Step 2: Initialize ESP loader
    updateProgress(20, t('initEsp'));
    log(t('initEsp'));

    espLoaderTerminal = new EspTerminal();

    // Check if EspLoader is available
    if (typeof window.EspLoader === 'undefined' ||
        typeof window.Transport === 'undefined') {
      throw new Error(t('esptoolNotLoaded'));
    }

    const transport = new window.Transport(port);
    const loaderOptions = {
      transport: transport,
      baudrate: 115200,
      terminal: espLoaderTerminal,
      romBaudrate: 115200,
      enableTracing: false
    };

    const esploader = new window.EspLoader(loaderOptions);

    // Enter bootloader mode
    log(t('bootloaderMode'));
    await esploader.main();

    log(t('chipDetected', {chip: esploader.chipName}), 'success');

    updateProgress(35, t('preparingWrite'));

    // Step 3: Flash firmware
    updateProgress(40, t('writingFirmware'));
    log(t('writingFirmware'));

    // Convert Uint8Array to binary string (required by esptool-js)
    const binaryString = Array.from(selectedFileData)
                             .map(byte => String.fromCharCode(byte))
                             .join('');

    const flashOptions = {
      fileArray: [{
        data: binaryString,
        address: 0x0  // For merged binary, start at 0
      }],
      flashSize: 'keep',
      flashMode: 'keep',
      flashFreq: 'keep',
      eraseAll: false,
      compress: true,
      reportProgress: (fileIndex, written, total) => {
        const percent = Math.round((written / total) * 55) + 40;  // 40-95%
        updateProgress(percent, t('writingProgress', {
          written: formatSize(written),
          total: formatSize(total)
        }));
      }
    };

    await esploader.writeFlash(flashOptions);

    // Step 4: Reset device
    updateProgress(95, t('restartingDevice'));
    log(t('restartingDevice'));

    await esploader.hardReset();

    // Done!
    updateProgress(100, t('flashSuccess'));
    setProgressState('success', t('flashSuccess'));
    log(t('flashDoneLog'), 'success');

    flashBtn.textContent = t('done');
    cancelBtn.textContent = t('close');

  } catch (error) {
    console.error('Flash error:', error);
    log(t('errorPrefix', {message: error.message}), 'error');
    setProgressState('error', `❌ ${t('errorPrefix', {message: error.message})}`);

    flashBtn.disabled = false;
    flashBtn.textContent = t('retry');
  } finally {
    isFlashing = false;

    // Close port
    if (port) {
      try {
        await port.close();
      } catch (e) {
        console.error('Error closing port:', e);
      }
      port = null;
    }
  }
}

// Create release card HTML
function createReleaseCard(release, isLatest) {
  const card = document.createElement('div');
  card.className = `release-card${isLatest ? ' latest' : ''}`;

  const firmwareList = findAllMergedFirmware(release.assets);
  const hasWebSerial = window.isSecureContext && ('serial' in navigator);

  let installButton = '';
  if (firmwareList.length > 0 && hasWebSerial) {
    // Store firmware data in a global map
    const firmwareId = `firmware_${release.id}`;
    window[firmwareId] = firmwareList;

    installButton = `
            <button class="install-btn" onclick="openFlashModal('${
        release.tag_name}', window.${firmwareId})">
          ${t('install')}
            </button>
        `;
  } else if (firmwareList.length > 0 && !hasWebSerial) {
    installButton =
      `<button class="install-btn" disabled title="${t('browserNoWebSerialTitle')}">${t('browserNotSupported')}</button>`;
  } else {
    installButton =
      `<button class="install-btn" disabled>${t('binaryNotFound')}</button>`;
  }

  const assetsHtml =
      release.assets
          .filter(a => a.name.endsWith('.bin') || a.name.endsWith('.zip'))
          .map(
              a => `
            <a href="${a.browser_download_url}" class="asset-link" title="${
                  formatSize(a.size)}">
                📁 ${a.name}
            </a>
        `).join('');

  card.innerHTML = `
      ${isLatest ? `<span class="latest-badge">${t('latestVersionBadge')}</span>` : ''}
        <div class="release-header">
            <div class="release-info">
                <h3><a href="${release.html_url}" target="_blank">${
      release.name || release.tag_name}</a></h3>
                <span class="release-date">📅 ${
      formatDate(release.published_at)}</span>
            </div>
            <div class="release-actions">
                ${installButton}
            </div>
        </div>
        ${
      release.body ?
          `<div class="release-body">${parseMarkdown(release.body)}</div>` :
          ''}
        ${assetsHtml ? `<div class="release-assets">${assetsHtml}</div>` : ''}
    `;

  return card;
}

function renderReleases() {
  releasesList.innerHTML = '';

  if (releasesCache.length === 0) {
    const repoLink =
        `<a href="https://github.com/${GITHUB_REPO}/releases" target="_blank">${t('githubRepo')}</a>`;
    releasesList.innerHTML = `
      <div class="error-message">
        <p>${t('noReleases', {link: repoLink})}</p>
      </div>
    `;
    return;
  }

  releasesCache.forEach((release, index) => {
    const card = createReleaseCard(release, index === 0);
    releasesList.appendChild(card);
  });
}

// Fetch and display releases
async function fetchReleases() {
  try {
    const response = await fetch(GITHUB_API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    releasesCache = await response.json();

    loadingEl.style.display = 'none';
    renderReleases();

  } catch (error) {
    console.error('Error fetching releases:', error);
    loadingEl.style.display = 'none';
    releasesList.innerHTML = `
            <div class="error-message">
                <p>${t('loadReleasesError', {message: error.message})}</p>
                <p>${t('tryOpenDirectly', {link: `<a href="https://github.com/${
        GITHUB_REPO}/releases" target="_blank">${t('openGithubDirectly')}</a>`})}</p>
            </div>
        `;
  }
}

// Erase flash
async function startErase() {
  if (!('serial' in navigator)) {
    alert(t('serialUnsupported'));
    return;
  }

  const eraseBtn = document.getElementById('eraseBtn');
  const eraseProgress = document.getElementById('eraseProgress');
  const eraseProgressFill = document.getElementById('eraseProgressFill');
  const eraseProgressText = document.getElementById('eraseProgressText');
  const eraseLog = document.getElementById('eraseLog');

  function eraseLogMsg(message, type = 'info') {
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    p.className = `log-${type}`;
    eraseLog.appendChild(p);
    eraseLog.scrollTop = eraseLog.scrollHeight;
  }

  if (!confirm(t('eraseConfirm'))) {
    return;
  }

  eraseBtn.disabled = true;
  eraseBtn.textContent = t('erasing');
  eraseLog.innerHTML = '';
  eraseLog.classList.add('active');
  eraseProgress.style.display = 'block';
  eraseProgressFill.style.width = '0%';

  let erasePort = null;

  try {
    eraseLogMsg(t('selectComPort'));
    eraseProgressFill.style.width = '10%';
    eraseProgressText.textContent = t('connectToDevice');

    erasePort = await navigator.serial.requestPort();
    eraseLogMsg(t('portSelected'), 'success');

    if (typeof window.EspLoader === 'undefined' ||
        typeof window.Transport === 'undefined') {
      throw new Error(t('esptoolNotLoaded'));
    }

    eraseProgressFill.style.width = '20%';
    eraseProgressText.textContent = t('initEsp');
    eraseLogMsg(t('initEsp'));

    const terminal = {
      clean() {},
      writeLine(data) {
        eraseLogMsg(data);
      },
      write(data) {
        const lastP = eraseLog.lastElementChild;
        if (lastP && !lastP.textContent.includes('[')) {
          lastP.textContent += data;
        } else {
          const p = document.createElement('p');
          p.textContent = data;
          eraseLog.appendChild(p);
        }
        eraseLog.scrollTop = eraseLog.scrollHeight;
      }
    };

    const transport = new window.Transport(erasePort);
    const esploader = new window.EspLoader({
      transport: transport,
      baudrate: 115200,
      terminal: terminal,
      romBaudrate: 115200,
      enableTracing: false
    });

    eraseLogMsg(t('bootloaderMode'));
    await esploader.main();
    eraseLogMsg(t('chipDetected', {chip: esploader.chipName}), 'success');

    eraseProgressFill.style.width = '40%';
    eraseProgressText.textContent = t('erasingFlash');
    eraseLogMsg(t('erasingMayTakeTime'));

    await esploader.eraseFlash();

    eraseProgressFill.style.width = '90%';
    eraseProgressText.textContent = t('restartingDevice');
    eraseLogMsg(t('restartingDevice'));

    await esploader.hardReset();

    eraseProgressFill.style.width = '100%';
    eraseProgressText.textContent = t('eraseSuccess');
    eraseProgressText.className = 'progress-text success';
    eraseLogMsg(t('eraseSuccessLog'), 'success');

    eraseBtn.textContent = t('done');

  } catch (error) {
    console.error('Erase error:', error);
    eraseLogMsg(t('errorPrefix', {message: error.message}), 'error');
    eraseProgressText.textContent = `❌ ${t('errorPrefix', {message: error.message})}`;
    eraseProgressText.className = 'progress-text error';
  } finally {
    eraseBtn.disabled = false;
    if (eraseBtn.textContent === t('erasing')) {
      eraseBtn.textContent = t('eraseBtnDefault');
    }
    setTimeout(() => {
      eraseBtn.textContent = t('eraseBtnDefault');
    }, 3000);

    if (erasePort) {
      try {
        await erasePort.close();
      } catch (e) {
        console.error('Error closing port:', e);
      }
    }
  }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && flashModal.classList.contains('active')) {
    closeFlashModal();
  }
});

// Close modal on backdrop click
flashModal.addEventListener('click', (e) => {
  if (e.target === flashModal) {
    closeFlashModal();
  }
});

// Check if ESPTool is loaded
function checkEsptoolLoaded() {
  if (window.esptoolLoaded) {
    console.log('ESPTool loaded successfully');
    return true;
  }
  console.log('Waiting for ESPTool to load...');
  return false;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const savedLanguage = localStorage.getItem('siteLanguage');
  const browserLanguage = navigator.language.toLowerCase().startsWith('uk') ?
      'uk' :
      'en';
  currentLanguage = savedLanguage && translations[savedLanguage] ?
      savedLanguage :
      browserLanguage;

  applyTranslations();
  checkWebSerialSupport();
  fetchReleases();

  // Check esptool status
  if (!checkEsptoolLoaded()) {
    window.addEventListener('esptool-loaded', () => {
      console.log('ESPTool loaded event received');
    });
  }
});
