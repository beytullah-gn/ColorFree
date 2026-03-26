const MENU_ID = "pick-color-context-menu";
const TEXT_STYLE_MENU_ID = "selected-text-style-context-menu";
const NATIVE_APP_ID = "yunsoft.WebElementTool";
const HISTORY_KEY = "recentColors";
const HISTORY_LIMIT = 10;
const UI_THEME_KEY = "uiThemeScheme";

function getMessage(key, fallback, substitutions) {
  return browser.i18n.getMessage(key, substitutions) || fallback;
}

function getTextInspectorMessages() {
  return {
    noTextSelected: getMessage(
      "text_inspector_no_text_selected",
      "No text selected.",
    ),
    selectedElementError: getMessage(
      "text_inspector_selected_element_error",
      "Could not read selected element.",
    ),
    close: getMessage("text_inspector_close", "Close"),
    closeAriaLabel: getMessage(
      "text_inspector_close_aria_label",
      "Close text properties",
    ),
    title: getMessage("text_inspector_title", "Text Properties"),
    copyPrompt: getMessage(
      "text_inspector_copy_prompt",
      "Copy text style value",
    ),
    styleColor: getMessage("style_label_color", "Color"),
    styleFont: getMessage("style_label_font", "Font"),
    styleSize: getMessage("style_label_size", "Size"),
    styleWeight: getMessage("style_label_weight", "Weight"),
  };
}

async function getStoredThemeScheme() {
  try {
    const data = await browser.storage.local.get(UI_THEME_KEY);
    const value = data?.[UI_THEME_KEY];
    if (value === "dark" || value === "light") {
      return value;
    }
  } catch (_error) {
    // Ignore read errors and use default.
  }

  return "light";
}

async function getThemeScheme() {
  return getStoredThemeScheme();
}

async function getContextMenuIcons() {
  const scheme = await getThemeScheme();

  if (scheme === "dark") {
    return {
      pickColor: {
        16: "images/eyedropper-light.svg",
        32: "images/eyedropper-light.svg",
      },
      textProperties: {
        16: "images/text-properties-light.svg",
        32: "images/text-properties-light.svg",
      },
    };
  }

  return {
    pickColor: {
      16: "images/eyedropper-dark.svg",
      32: "images/eyedropper-dark.svg",
    },
    textProperties: {
      16: "images/text-properties-dark.svg",
      32: "images/text-properties-dark.svg",
    },
  };
}

function inspectSelectedTextOnPage(showPanel = false, messages = {}) {
  const PANEL_ID = "color-free-text-style-panel";
  const resolvedMessages = {
    noTextSelected: messages.noTextSelected || "No text selected.",
    selectedElementError:
      messages.selectedElementError || "Could not read selected element.",
    close: messages.close || "Close",
    closeAriaLabel: messages.closeAriaLabel || "Close text properties",
    title: messages.title || "Text Properties",
    copyPrompt: messages.copyPrompt || "Copy text style value",
    styleColor: messages.styleColor || "Color",
    styleFont: messages.styleFont || "Font",
    styleSize: messages.styleSize || "Size",
    styleWeight: messages.styleWeight || "Weight",
  };

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return { ok: false, error: resolvedMessages.noTextSelected };
  }

  const selectedText = (selection.toString() || "").trim();
  if (!selectedText) {
    return { ok: false, error: resolvedMessages.noTextSelected };
  }

  const range = selection.getRangeAt(0);
  const sourceNode = selection.anchorNode || range.startContainer;
  const sourceElement =
    sourceNode?.nodeType === Node.ELEMENT_NODE
      ? sourceNode
      : sourceNode?.parentElement;

  if (!sourceElement) {
    return { ok: false, error: resolvedMessages.selectedElementError };
  }

  const styles = window.getComputedStyle(sourceElement);
  const payload = {
    ok: true,
    text:
      selectedText.length > 160
        ? `${selectedText.slice(0, 157)}...`
        : selectedText,
    style: {
      color: styles.color,
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
    },
  };

  if (!showPanel) {
    return payload;
  }

  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.position = "fixed";
    panel.style.right = "16px";
    panel.style.bottom = "16px";
    panel.style.zIndex = "2147483647";
    panel.style.width = "320px";
    panel.style.maxWidth = "calc(100vw - 24px)";
    panel.style.borderRadius = "12px";
    panel.style.border = "1px solid rgba(255, 255, 255, 0.25)";
    panel.style.background = "rgba(17, 24, 39, 0.93)";
    panel.style.backdropFilter = "blur(12px)";
    panel.style.color = "#F9FAFB";
    panel.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    panel.style.fontSize = "12px";
    panel.style.lineHeight = "1.4";
    panel.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.35)";
    panel.style.padding = "12px";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = resolvedMessages.close;
    closeButton.setAttribute("aria-label", resolvedMessages.closeAriaLabel);
    closeButton.style.position = "absolute";
    closeButton.style.top = "6px";
    closeButton.style.right = "6px";
    closeButton.style.width = "34px";
    closeButton.style.height = "34px";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "999px";
    closeButton.style.cursor = "pointer";
    closeButton.style.fontSize = "0";
    closeButton.style.display = "grid";
    closeButton.style.placeItems = "center";
    closeButton.style.background = "rgba(255, 255, 255, 0.15)";
    closeButton.style.color = "#F9FAFB";
    closeButton.style.zIndex = "2";
    closeButton.style.pointerEvents = "auto";
    closeButton.style.userSelect = "none";
    closeButton.innerHTML =
      '<span style="font-size:14px;line-height:1;">x</span>';
    closeButton.addEventListener("click", () => panel?.remove());
    panel.appendChild(closeButton);

    const titleRow = document.createElement("div");
    titleRow.style.display = "inline-flex";
    titleRow.style.alignItems = "center";
    titleRow.style.gap = "6px";
    titleRow.style.marginBottom = "8px";

    const titleIcon = document.createElement("span");
    titleIcon.textContent = "Aa";
    titleIcon.style.display = "inline-flex";
    titleIcon.style.alignItems = "center";
    titleIcon.style.justifyContent = "center";
    titleIcon.style.width = "18px";
    titleIcon.style.height = "18px";
    titleIcon.style.borderRadius = "6px";
    titleIcon.style.fontSize = "10px";
    titleIcon.style.fontWeight = "700";
    titleIcon.style.background = "rgba(255, 255, 255, 0.18)";
    titleIcon.style.color = "#F9FAFB";

    const title = document.createElement("div");
    title.textContent = resolvedMessages.title;
    title.style.fontSize = "11px";
    title.style.letterSpacing = "0.08em";
    title.style.textTransform = "uppercase";
    title.style.opacity = "0.9";

    titleRow.append(titleIcon, title);
    panel.appendChild(titleRow);

    const selectedTextBox = document.createElement("div");
    selectedTextBox.id = `${PANEL_ID}-text`;
    selectedTextBox.style.padding = "8px";
    selectedTextBox.style.border = "1px solid rgba(255, 255, 255, 0.2)";
    selectedTextBox.style.borderRadius = "8px";
    selectedTextBox.style.marginBottom = "8px";
    selectedTextBox.style.wordBreak = "break-word";
    panel.appendChild(selectedTextBox);

    const list = document.createElement("div");
    list.id = `${PANEL_ID}-list`;
    list.style.display = "grid";
    list.style.gap = "6px";
    panel.appendChild(list);

    document.documentElement.appendChild(panel);
  }

  const selectedTextBox = panel.querySelector(`#${PANEL_ID}-text`);
  if (selectedTextBox) {
    selectedTextBox.textContent = payload.text;
  }

  const list = panel.querySelector(`#${PANEL_ID}-list`);
  if (list) {
    list.replaceChildren();

    const rows = [
      [resolvedMessages.styleColor, payload.style.color],
      [resolvedMessages.styleFont, payload.style.fontFamily],
      [resolvedMessages.styleSize, payload.style.fontSize],
      [resolvedMessages.styleWeight, payload.style.fontWeight],
    ];

    rows.forEach(([label, value]) => {
      const row = document.createElement("button");
      row.type = "button";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.gap = "12px";
      row.style.padding = "7px 8px";
      row.style.border = "1px solid rgba(255, 255, 255, 0.14)";
      row.style.borderRadius = "8px";
      row.style.background = "rgba(255, 255, 255, 0.06)";
      row.style.color = "#F3F4F6";
      row.style.cursor = "pointer";

      const left = document.createElement("span");
      left.textContent = label;
      left.style.fontSize = "10px";
      left.style.letterSpacing = "0.05em";
      left.style.textTransform = "uppercase";
      left.style.opacity = "0.8";

      const right = document.createElement("span");
      right.textContent = value;
      right.style.fontSize = "12px";
      right.style.maxWidth = "220px";
      right.style.whiteSpace = "nowrap";
      right.style.overflow = "hidden";
      right.style.textOverflow = "ellipsis";

      row.append(left, right);
      row.addEventListener("click", async () => {
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return;
          }
        } catch (_error) {
          // Fallback to prompt below.
        }
        window.prompt(resolvedMessages.copyPrompt, value);
      });

      list.appendChild(row);
    });
  }

  return payload;
}

async function executeScriptInTab(tabId, func, args = []) {
  if (!tabId) {
    return { ok: false, error: "No active tab found." };
  }

  if (browser.scripting?.executeScript) {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      func,
      args,
    });

    return results?.[0]?.result;
  }

  if (browser.tabs?.executeScript) {
    const encodedArgs = JSON.stringify(args);
    const code = `(${String(func)})(...${encodedArgs});`;
    const results = await browser.tabs.executeScript(tabId, { code });
    return Array.isArray(results) ? results[0] : results;
  }

  return { ok: false, error: "Script injection API is not available." };
}

async function inspectSelectedTextForTab(tabId, showPanel = false) {
  try {
    const messages = getTextInspectorMessages();
    const result = await executeScriptInTab(tabId, inspectSelectedTextOnPage, [
      showPanel,
      messages,
    ]);

    if (result?.ok) {
      return result;
    }

    return result || { ok: false, error: "No style result returned." };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

async function getColorHistory() {
  try {
    const data = await browser.storage.local.get(HISTORY_KEY);
    const history = data?.[HISTORY_KEY];

    if (!Array.isArray(history)) {
      return [];
    }

    return history.filter((item) => typeof item === "string");
  } catch (error) {
    console.warn("Could not read color history:", error);
    return [];
  }
}

async function saveColorToHistory(color) {
  if (typeof color !== "string") {
    return getColorHistory();
  }

  const normalized = color.toUpperCase();
  const previous = await getColorHistory();
  const next = [
    normalized,
    ...previous.filter((item) => item !== normalized),
  ].slice(0, HISTORY_LIMIT);

  try {
    await browser.storage.local.set({ [HISTORY_KEY]: next });
  } catch (error) {
    console.warn("Could not write color history:", error);
  }

  return next;
}

async function startNativeColorPicker() {
  if (!browser.runtime?.sendNativeMessage) {
    throw new Error("Native messaging is not available.");
  }

  return browser.runtime.sendNativeMessage(NATIVE_APP_ID, {
    type: "PICK_COLOR",
  });
}

async function pickColorAndPersist() {
  const result = await startNativeColorPicker();

  if (result?.ok && result?.color) {
    const colors = await saveColorToHistory(result.color);
    return { ...result, colors };
  }

  return result;
}

async function createContextMenu() {
  if (!browser.contextMenus) {
    return;
  }

  const icons = await getContextMenuIcons();

  try {
    await browser.contextMenus.removeAll();
  } catch (_error) {
    // Ignore cleanup errors and keep creating the menu.
  }

  browser.contextMenus.create({
    id: MENU_ID,
    title: browser.i18n.getMessage("pick_color_menu_title") || "Pick Color",
    contexts: ["all"],
    icons: icons.pickColor,
  });

  browser.contextMenus.create({
    id: TEXT_STYLE_MENU_ID,
    title:
      browser.i18n.getMessage("text_style_menu_title") || "Text Properties",
    contexts: ["selection"],
    icons: icons.textProperties,
  });
}

createContextMenu();
browser.runtime.onInstalled.addListener(createContextMenu);

if (browser.runtime.onStartup) {
  browser.runtime.onStartup.addListener(createContextMenu);
}

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID) {
    pickColorAndPersist()
      .then((result) => {
        if (result?.ok && result?.color) {
          console.log("Picked color:", result.color);
          return;
        }

        if (result?.canceled) {
          console.log("Color picking canceled by user.");
          return;
        }

        console.warn("Color picker finished with no color result:", result);
      })
      .catch((error) => {
        console.error("Could not start native color picker:", error);
      });
    return;
  }

  if (info.menuItemId === TEXT_STYLE_MENU_ID) {
    inspectSelectedTextForTab(tab?.id, true)
      .then((result) => {
        if (!result?.ok) {
          console.warn("Could not inspect selected text style:", result);
        }
      })
      .catch((error) => {
        console.error("Could not inspect selected text style:", error);
      });
  }
});

browser.runtime.onMessage.addListener(async (request) => {
  if (request?.type === "START_PICK_COLOR") {
    try {
      const result = await pickColorAndPersist();
      return result || { ok: false };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  }

  if (request?.type === "GET_COLOR_HISTORY") {
    const colors = await getColorHistory();
    return { ok: true, colors };
  }

  if (request?.type === "START_TEXT_STYLE_INSPECT") {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTab = tabs?.[0];
    return inspectSelectedTextForTab(activeTab?.id, false);
  }

  if (request?.type === "SET_UI_THEME_SCHEME") {
    const scheme = request?.scheme === "dark" ? "dark" : "light";

    try {
      await browser.storage.local.set({ [UI_THEME_KEY]: scheme });
    } catch (_error) {
      // Ignore persistence errors; menu refresh still proceeds.
    }

    createContextMenu();
    return { ok: true };
  }

  if (request?.type === "COLOR_PICKED" && request?.color) {
    const colors = await saveColorToHistory(request.color);
    return { ok: true, colors };
  }

  return undefined;
});
