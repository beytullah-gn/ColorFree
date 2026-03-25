# Color Free

Color Free is a macOS app with a Safari Web Extension that combines native macOS color sampling with quick in-browser inspection tools.

It now covers both color workflows and selected text style inspection inside Safari.

## Features

### Color Picking

- Native macOS color picker integration via `NSColorSampler`
- Safari context menu action: `Pick Color`
- Toolbar popup action: `Pick Color`
- Popup-based general color creator using a standard color input
- Automatic clipboard copy for picked HEX values
- Recent color history stored locally, limited to 10 unique entries

### Color Formats

Each saved color can be copied with one click in these formats:

- HEX
- RGB
- HSL
- HSV
- CMYK

### Text Style Inspection

- Safari context menu action for selected text: `Text Properties`
- Popup action: `Inspect Selected Text`
- Reads style data from the active page selection
- Shows selected text preview
- Extracts and displays:
  - text color
  - font family
  - font size
  - font weight
- Each style value can be copied directly from the popup
- Context menu inspection can also render a floating panel on the page

### Popup Utilities

- Current page size display for the active tab
- GitHub repository shortcut
- Theme-aware context menu icon selection based on popup appearance

### Localization

- Built-in UI localization for 18 languages:
  - English
  - Turkish
  - Spanish
  - Arabic
  - Bengali
  - Chinese (Simplified)
  - German
  - French
  - Hindi
  - Indonesian
  - Italian
  - Japanese
  - Korean
  - Malay
  - Portuguese (Brazil)
  - Punjabi
  - Russian
  - Urdu
- Localized Safari context menu labels
- Localized popup labels, statuses, and prompts
- Localized on-page text inspector panel labels
- Localized macOS host app onboarding screen

## Tech Stack

- Swift for the macOS host app and Safari native messaging bridge
- Safari Web Extension using Manifest V3
- Vanilla JavaScript, HTML, and CSS for popup and extension UI

## Project Structure

- `Color Free/`: macOS host application
- `Color Free Extension/`: Safari Web Extension target
- `Color Free.xcodeproj/`: Xcode project

## Requirements

- macOS 10.15 or newer for native color sampling
- Safari with Web Extension support
- Xcode with Safari extension development support

## How It Works

### Native Color Flow

1. The user starts color picking from the popup or Safari context menu.
2. The background script sends a native message to the macOS host.
3. The Swift extension handler opens `NSColorSampler`.
4. The selected color is converted to HEX.
5. The HEX value is copied to the clipboard.
6. The color is persisted in local extension storage.
7. The popup renders the saved item and derived color formats.

### Text Inspection Flow

1. The user selects text on a page.
2. The user triggers `Text Properties` from the context menu or `Inspect Selected Text` from the popup.
3. The extension injects a page function into the active tab.
4. Computed styles are collected from the selected element.
5. The result is shown in the popup or an in-page floating panel.

## Build and Run

1. Open `Color Free.xcodeproj` in Xcode.
2. Select the `Color Free` scheme.
3. Run the macOS app target.
4. Enable the extension in Safari:
   - `Safari > Settings > Extensions > Color Free Extension`
5. Use one of these entry points:
   - popup `Pick Color`
   - popup `Create Color`
   - popup `Inspect Selected Text`
   - Safari right-click `Pick Color`
   - Safari right-click `Text Properties` on a text selection

## Permissions

The extension currently requests these permissions:

- `contextMenus`
- `nativeMessaging`
- `activeTab`
- `storage`
- `scripting`

These are used for Safari context menu integration, the native macOS bridge, active tab inspection, local persistence, and script injection for selected text analysis.

## Privacy

- No remote API calls are required for core features.
- Picked colors and UI preferences are stored locally.
- Text inspection runs only on the active tab and only after an explicit user action.
- Native color sampling starts only when the user triggers it.

## Development Notes

- Localization strings are stored in `Color Free Extension/Resources/_locales/en/messages.json`.
- Additional locale files are available under `Color Free Extension/Resources/_locales/` for Arabic, Bengali, Chinese, German, French, Hindi, Indonesian, Italian, Japanese, Korean, Malay, Portuguese, Punjabi, Russian, Turkish, Urdu, and Spanish.
- Popup behavior is implemented in `Color Free Extension/Resources/popup.js`.
- Background messaging, context menus, and history persistence are handled in `Color Free Extension/Resources/background.js`.
- Native picker handling is implemented in `Color Free Extension/SafariWebExtensionHandler.swift`.
- The macOS host app shows extension status, opens Safari extension settings, and localizes its onboarding text in `Color Free/Resources/Script.js`.

## License

This project is licensed under a proprietary `All Rights Reserved` license.
See `LICENSE` for full terms.
