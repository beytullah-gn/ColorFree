const pickButton = document.getElementById("pick-color-button");
const labelEl = document.getElementById("pick-color-label");
const historyList = document.getElementById("history-list");
const statusText = document.getElementById("status");
const repoLink = document.getElementById("repo-link");
const generalPickerButton = document.getElementById("open-general-picker");
const generalColorInput = document.getElementById("general-color-input");
const pageSizeInfo = document.getElementById("page-size-info");
const inspectTextStyleButton = document.getElementById(
  "inspect-text-style-button",
);
const textStyleTitleLabel = document.getElementById("text-style-title-label");
const selectedTextPreview = document.getElementById("selected-text-preview");
const textStyleList = document.getElementById("text-style-list");

const pickColorLabel =
  browser.i18n.getMessage("popup_pick_color") || "Pick Color";
const recentColorsLabel =
  browser.i18n.getMessage("popup_recent_colors") || "Recent Colors";
const noColorsLabel =
  browser.i18n.getMessage("popup_no_colors") || "No colors picked yet.";
const githubRepoLabel =
  browser.i18n.getMessage("popup_github_repo") || "GitHub Repo";
const generalPickerLabel =
  browser.i18n.getMessage("popup_general_picker") || "Color Picker";
const selectedTextStyleLabel =
  browser.i18n.getMessage("popup_selected_text_style") || "Selected Text Style";
const inspectSelectedTextLabel =
  browser.i18n.getMessage("popup_inspect_selected_text") ||
  "Inspect Selected Text";
const noSelectedTextLabel =
  browser.i18n.getMessage("popup_no_selected_text") ||
  "No selected text found.";

if (labelEl) labelEl.textContent = pickColorLabel;
document.querySelector(".history-title").textContent = recentColorsLabel;
if (repoLink) repoLink.textContent = githubRepoLabel;
if (generalPickerButton) generalPickerButton.textContent = generalPickerLabel;
if (textStyleTitleLabel)
  textStyleTitleLabel.textContent = selectedTextStyleLabel;
if (inspectTextStyleButton)
  inspectTextStyleButton.textContent = inspectSelectedTextLabel;
if (selectedTextPreview) selectedTextPreview.textContent = noSelectedTextLabel;

async function syncThemeSchemeForContextMenu() {
  let scheme = "light";

  try {
    const target = document.body || document.documentElement;
    const color = window.getComputedStyle(target).color || "rgb(17, 24, 39)";
    const matches = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);

    if (matches) {
      const r = Number(matches[1]);
      const g = Number(matches[2]);
      const b = Number(matches[3]);
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

      // Light text usually means dark theme, dark text usually means light theme.
      scheme = luminance > 0.58 ? "dark" : "light";
    } else if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      scheme = "dark";
    }
  } catch (_error) {
    // Keep light fallback.
  }

  try {
    await browser.runtime.sendMessage({
      type: "SET_UI_THEME_SCHEME",
      scheme,
    });
  } catch (_error) {
    // Ignore sync errors; popup features can still work.
  }
}

function formatPageSize(width, height) {
  return `${width} x ${height}px`;
}

async function loadActivePageSize() {
  if (!pageSizeInfo) {
    return;
  }

  pageSizeInfo.textContent = "-";

  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTab = tabs?.[0];

    if (
      activeTab &&
      Number.isFinite(activeTab.width) &&
      Number.isFinite(activeTab.height)
    ) {
      pageSizeInfo.textContent = formatPageSize(
        activeTab.width,
        activeTab.height,
      );
      return;
    }

    pageSizeInfo.textContent = "-";
  } catch (_error) {
    pageSizeInfo.textContent = "-";
  }
}

function setStatus(message, isError = false) {
  statusText.textContent = message || "Ready";
  statusText.classList.toggle("status-error", isError);
}

function createStyleFieldRow(label, value) {
  const listItem = document.createElement("li");
  listItem.className = "text-style-item";

  const rowButton = document.createElement("button");
  rowButton.type = "button";
  rowButton.className = "text-style-copy-btn";
  rowButton.dataset.copyValue = value;
  rowButton.title = "Copy value";

  const labelSpan = document.createElement("span");
  labelSpan.className = "text-style-label";
  labelSpan.textContent = label;

  const valueSpan = document.createElement("span");
  valueSpan.className = "text-style-value";
  valueSpan.textContent = value;

  rowButton.append(labelSpan, valueSpan);
  listItem.appendChild(rowButton);

  return listItem;
}

function renderSelectedTextStyle(result) {
  if (!selectedTextPreview || !textStyleList) {
    return;
  }

  textStyleList.replaceChildren();

  if (!result?.ok) {
    selectedTextPreview.textContent = noSelectedTextLabel;
    return;
  }

  selectedTextPreview.textContent = result.text || "Selected text";

  const styleRows = [
    ["Color", result.style.color],
    ["Font", result.style.fontFamily],
    ["Size", result.style.fontSize],
    ["Weight", result.style.fontWeight],
  ];

  styleRows.forEach(([label, value]) => {
    textStyleList.appendChild(createStyleFieldRow(label, value));
  });
}

async function inspectSelectedTextStyle() {
  const response = await browser.runtime.sendMessage({
    type: "START_TEXT_STYLE_INSPECT",
  });

  return response || { ok: false, error: "No style result returned." };
}

function hexToColorObj(hex) {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7 || hex.length === 9) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return { r, g, b };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `hsv(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`;
}

function rgbToCmyk(r, g, b) {
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  let k = Math.min(c, Math.min(m, y));

  if (k === 1) {
    return `cmyk(0%, 0%, 0%, 100%)`;
  }

  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);
  return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`;
}

function createColorRow(colorHex) {
  const listItem = document.createElement("li");
  listItem.className = "history-item";

  const { r, g, b } = hexToColorObj(colorHex);
  const colorRgb = `rgb(${r}, ${g}, ${b})`;
  const colorHsl = rgbToHsl(r, g, b);
  const colorHsv = rgbToHsv(r, g, b);
  const colorCmyk = rgbToCmyk(r, g, b);

  listItem.innerHTML = `
    <div class="swatch-container">
      <div class="swatch" style="background-color: ${colorHex}"></div>
    </div>
    <div class="color-info">
      <button type="button" class="copy-btn" data-color="${colorHex}" title="Copy Hex">
        <span class="label">HEX</span>
        <span class="value">${colorHex}</span>
      </button>
      <button type="button" class="copy-btn" data-color="${colorRgb}" title="Copy RGB">
        <span class="label">RGB</span>
        <span class="value">${colorRgb}</span>
      </button>
      <button type="button" class="copy-btn" data-color="${colorHsl}" title="Copy HSL">
        <span class="label">HSL</span>
        <span class="value">${colorHsl}</span>
      </button>
      <button type="button" class="copy-btn" data-color="${colorHsv}" title="Copy HSV">
        <span class="label">HSV</span>
        <span class="value">${colorHsv}</span>
      </button>
      <button type="button" class="copy-btn" data-color="${colorCmyk}" title="Copy CMYK">
        <span class="label">CMYK</span>
        <span class="value">${colorCmyk}</span>
      </button>
    </div>
  `;

  return listItem;
}

function renderHistory(colors) {
  historyList.replaceChildren();

  if (!colors.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-empty";
    emptyItem.textContent = noColorsLabel;
    historyList.appendChild(emptyItem);
    return;
  }

  colors.forEach((color) => {
    historyList.appendChild(createColorRow(color));
  });
}

async function loadHistory() {
  const response = await browser.runtime.sendMessage({
    type: "GET_COLOR_HISTORY",
  });
  const colors = Array.isArray(response?.colors) ? response.colors : [];
  renderHistory(colors);
}

async function copyColor(color) {
  try {
    await navigator.clipboard.writeText(color);
    setStatus(`Copied ${color}`);
    setTimeout(() => setStatus("Ready"), 2000);
  } catch (_error) {
    window.prompt("Copy color code", color);
    setStatus(`Selected ${color}`);
    setTimeout(() => setStatus("Ready"), 3000);
  }
}

historyList.addEventListener("click", (event) => {
  const copyBtn = event.target.closest(".copy-btn");
  if (!copyBtn) {
    return;
  }
  const color = copyBtn.dataset.color;
  if (color) {
    copyColor(color);
  }
});

if (textStyleList) {
  textStyleList.addEventListener("click", (event) => {
    const styleCopyButton = event.target.closest(".text-style-copy-btn");
    if (!styleCopyButton) {
      return;
    }

    const copyValue = styleCopyButton.dataset.copyValue;
    if (copyValue) {
      copyColor(copyValue);
    }
  });
}

if (inspectTextStyleButton) {
  inspectTextStyleButton.addEventListener("click", async () => {
    inspectTextStyleButton.disabled = true;
    setStatus("Inspecting selected text...");

    try {
      const inspectResult = await inspectSelectedTextStyle();
      renderSelectedTextStyle(inspectResult);

      if (inspectResult?.ok) {
        setStatus("Text style loaded.");
      } else {
        setStatus("Select any text on the page first.", true);
      }
    } catch (_error) {
      setStatus("Could not inspect selected text.", true);
    } finally {
      inspectTextStyleButton.disabled = false;
      setTimeout(() => setStatus("Ready"), 2200);
    }
  });
}

pickButton.addEventListener("click", async () => {
  pickButton.disabled = true;
  pickButton.classList.add("is-loading");
  setStatus("Picking color...");

  try {
    const result = await browser.runtime.sendMessage({
      type: "START_PICK_COLOR",
    });

    if (result?.ok && result?.color) {
      setStatus(`Copied ${result.color}`);
      renderHistory(Array.isArray(result.colors) ? result.colors : []);
      setTimeout(() => setStatus("Ready"), 2000);
      return;
    }

    if (result?.canceled) {
      setStatus("Canceled", false);
      setTimeout(() => setStatus("Ready"), 2000);
      return;
    }

    setStatus("Could not pick color.", true);
  } catch (_error) {
    setStatus("Could not start picker.", true);
  } finally {
    pickButton.disabled = false;
    pickButton.classList.remove("is-loading");
  }
});

loadHistory().catch(() => {
  setStatus("Could not load color history.", true);
});
loadActivePageSize();
syncThemeSchemeForContextMenu();
setStatus();

if (generalPickerButton && generalColorInput) {
  generalPickerButton.addEventListener("click", () => {
    generalColorInput.click();
  });

  generalColorInput.addEventListener("input", async () => {
    const picked = (generalColorInput.value || "").toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(picked)) {
      return;
    }

    try {
      await copyColor(picked);
      const response = await browser.runtime.sendMessage({
        type: "COLOR_PICKED",
        color: picked,
      });

      if (Array.isArray(response?.colors)) {
        renderHistory(response.colors);
      }
    } catch (_error) {
      setStatus("Could not save selected color.", true);
    }
  });
}
