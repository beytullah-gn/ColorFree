const MENU_ID = "pick-color-context-menu";
const NATIVE_APP_ID = "towin.Color-Free";
const HISTORY_KEY = "recentColors";
const HISTORY_LIMIT = 10;

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

function createContextMenu() {
  if (!browser.contextMenus) {
    return;
  }

  browser.contextMenus
    .removeAll()
    .catch(() => {
      // Ignore cleanup errors and keep creating the menu.
    })
    .finally(() => {
      browser.contextMenus.create({
        id: MENU_ID,
        title: browser.i18n.getMessage("pick_color_menu_title") || "Pick Color",
        contexts: ["all"],
        icons: {
          16: "images/eyedropper.svg",
          32: "images/eyedropper.svg",
        },
      });
    });
}

createContextMenu();
browser.runtime.onInstalled.addListener(createContextMenu);

if (browser.runtime.onStartup) {
  browser.runtime.onStartup.addListener(createContextMenu);
}

browser.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

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

  if (request?.type === "COLOR_PICKED" && request?.color) {
    const colors = await saveColorToHistory(request.color);
    return { ok: true, colors };
  }

  return undefined;
});
