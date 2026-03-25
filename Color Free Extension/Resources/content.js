(() => {
  if (window.__colorFreeContentScriptLoaded) {
    return;
  }

  window.__colorFreeContentScriptLoaded = true;

  const PICKER_OVERLAY_ID = "color-free-picker-overlay";
  const PICKER_PREVIEW_ID = "color-free-picker-preview";

  let isPicking = false;
  let currentColor = "#000000";

  const colorProbeCanvas = document.createElement("canvas");
  colorProbeCanvas.width = 1;
  colorProbeCanvas.height = 1;
  const colorProbeContext = colorProbeCanvas.getContext("2d");

  function toHex(value) {
    return value.toString(16).padStart(2, "0").toUpperCase();
  }

  function rgbStringToHex(color) {
    const match = color.match(/rgba?\(([^)]+)\)/i);
    if (!match) {
      return null;
    }

    const parts = match[1].split(",").map((part) => part.trim());
    const r = Number.parseInt(parts[0], 10);
    const g = Number.parseInt(parts[1], 10);
    const b = Number.parseInt(parts[2], 10);

    if ([r, g, b].some((part) => Number.isNaN(part))) {
      return null;
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function normalizeCssColorToHex(color) {
    if (!color || color === "transparent") {
      return null;
    }

    if (color.startsWith("#")) {
      if (color.length === 4) {
        return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
      }

      if (color.length === 7) {
        return color.toUpperCase();
      }

      return null;
    }

    if (!colorProbeContext) {
      return rgbStringToHex(color);
    }

    colorProbeContext.fillStyle = "#000000";
    colorProbeContext.fillStyle = color;

    return rgbStringToHex(colorProbeContext.fillStyle);
  }

  function getColorFromElement(element) {
    if (!element) {
      return null;
    }

    const styles = window.getComputedStyle(element);
    const candidates = [
      styles.backgroundColor,
      styles.color,
      styles.borderTopColor,
      styles.borderLeftColor,
    ];

    for (const candidate of candidates) {
      const hex = normalizeCssColorToHex(candidate);
      if (hex) {
        return hex;
      }
    }

    return null;
  }

  function getPickerOverlay() {
    return document.getElementById(PICKER_OVERLAY_ID);
  }

  function getPickerPreview() {
    return document.getElementById(PICKER_PREVIEW_ID);
  }

  function removePickerUi() {
    getPickerOverlay()?.remove();
    getPickerPreview()?.remove();
  }

  function createPickerUi() {
    const overlay = document.createElement("div");
    overlay.id = PICKER_OVERLAY_ID;
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483647";
    overlay.style.cursor = "crosshair";
    overlay.style.background = "transparent";

    const preview = document.createElement("div");
    preview.id = PICKER_PREVIEW_ID;
    preview.style.position = "fixed";
    preview.style.zIndex = "2147483647";
    preview.style.pointerEvents = "none";
    preview.style.padding = "6px 10px";
    preview.style.borderRadius = "8px";
    preview.style.border = "1px solid rgba(0, 0, 0, 0.2)";
    preview.style.background = "white";
    preview.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    preview.style.fontSize = "12px";
    preview.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)";
    preview.textContent = "#000000";

    document.documentElement.append(overlay, preview);
  }

  function updatePreview(x, y, color) {
    const preview = getPickerPreview();
    if (!preview) {
      return;
    }

    preview.textContent = `${color}  (Click to copy, Esc to cancel)`;
    preview.style.left = `${Math.min(x + 14, window.innerWidth - 260)}px`;
    preview.style.top = `${Math.min(y + 14, window.innerHeight - 32)}px`;
    preview.style.background = "white";
    preview.style.color = "#1f2937";
    preview.style.borderColor = "rgba(0, 0, 0, 0.2)";
  }

  function showToast(message, background = "#111827") {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.padding = "8px 12px";
    toast.style.borderRadius = "8px";
    toast.style.background = background;
    toast.style.color = "#ffffff";
    toast.style.fontSize = "12px";
    toast.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    toast.style.zIndex = "2147483647";
    toast.style.boxShadow = "0 10px 24px rgba(0, 0, 0, 0.25)";

    document.documentElement.appendChild(toast);
    window.setTimeout(() => toast.remove(), 1600);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_error) {
      // Fall back to execCommand path below.
    }

    try {
      const input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.focus();
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      if (copied) {
        return true;
      }
    } catch (_error) {
      // Fall back to manual copy prompt below.
    }

    window.prompt("Copy color code", text);
    return false;
  }

  function cleanupPicker() {
    isPicking = false;
    window.removeEventListener("mousemove", onMouseMove, true);
    window.removeEventListener("click", onMouseClick, true);
    window.removeEventListener("keydown", onKeyDown, true);
    removePickerUi();
  }

  function onMouseMove(event) {
    const overlay = getPickerOverlay();
    if (!overlay) {
      return;
    }

    overlay.style.display = "none";
    const target = document.elementFromPoint(event.clientX, event.clientY);
    overlay.style.display = "block";

    currentColor = getColorFromElement(target) || "#000000";
    updatePreview(event.clientX, event.clientY, currentColor);
  }

  async function onMouseClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const colorToCopy = currentColor;
    cleanupPicker();

    const copied = await copyToClipboard(colorToCopy);

    await browser.runtime
      .sendMessage({
        type: "COLOR_PICKED",
        color: colorToCopy,
      })
      .catch(() => {
        return { ok: false };
      });

    showToast(copied ? `Copied ${colorToCopy}` : `Selected ${colorToCopy}`);
  }

  function onKeyDown(event) {
    if (event.key !== "Escape") {
      return;
    }

    cleanupPicker();
    showToast("Color picker canceled", "#374151");
  }

  async function startColorPick() {
    if (isPicking) {
      return;
    }

    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        const color = (result?.sRGBHex || "").toUpperCase();
        if (!color) {
          return;
        }

        const copied = await copyToClipboard(color);

        await browser.runtime
          .sendMessage({
            type: "COLOR_PICKED",
            color,
          })
          .catch(() => {
            return { ok: false };
          });

        showToast(copied ? `Copied ${color}` : `Selected ${color}`);

        return;
      } catch (_error) {
        // Fall through to manual mode if EyeDropper is unavailable or canceled.
      }
    }

    isPicking = true;
    createPickerUi();
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("click", onMouseClick, true);
    window.addEventListener("keydown", onKeyDown, true);
    showToast("Pick mode enabled", "#1D4ED8");
  }

  browser.runtime.onMessage.addListener((request) => {
    if (request?.type === "START_COLOR_PICK") {
      startColorPick();
    }
  });
})();
