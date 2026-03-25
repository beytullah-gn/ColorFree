# Color Free

Color Free is a macOS app + Safari Web Extension for picking colors with the native macOS color sampler.

The extension provides:

- A Safari context menu action: Pick Color
- A toolbar popup action: Pick Color
- Automatic copy to clipboard for picked HEX values
- Recent color history (up to 10 items)
- One-click copy in multiple formats: HEX, RGB, HSL, HSV, and CMYK

## Tech Stack

- Swift (macOS host app and native extension handler)
- Safari Web Extension (Manifest V3)
- Vanilla JavaScript, HTML, CSS (popup and background scripts)

## Project Structure

- Color Free/: macOS host application
- Color Free Extension/: Safari Web Extension target
- Color Free.xcodeproj/: Xcode project

## Requirements

- macOS 10.15 or newer for native color sampling
- Safari with extension support enabled
- Xcode (recent version recommended)

## How It Works

1. The user starts color picking from either:
   - Safari right-click menu: Pick Color
   - Extension popup button: Pick Color
2. The extension background script sends a native message.
3. The Swift extension handler opens NSColorSampler.
4. Selected color is converted to HEX and copied to clipboard.
5. Color is stored in local extension history.
6. Popup renders history and computed format values.

## Build and Run (Xcode)

1. Open Color Free.xcodeproj in Xcode.
2. Select the Color Free scheme.
3. Run the app.
4. Enable the extension in Safari:
   - Safari > Settings > Extensions > Color Free Extension
5. Use either context menu or popup to start picking colors.

## Safari Permissions

Current extension permissions:

- contextMenus
- nativeMessaging
- activeTab
- storage

These are used only for menu integration, native color picker bridge, active-tab interaction, and local history persistence.

## Privacy Notes

- No remote API calls are required for color picking.
- Color history is stored locally via browser storage.
- Native picker runs only when explicitly triggered by user action.

## Development Notes

- Localized strings are in Color Free Extension/Resources/\_locales/en/messages.json.
- Popup UI logic is in Color Free Extension/Resources/popup.js.
- Native picker bridge is implemented in Color Free Extension/SafariWebExtensionHandler.swift.

## License

This project is licensed under a proprietary "All Rights Reserved" license.
See LICENSE for full terms.
