//
//  SafariWebExtensionHandler.swift
//  Color Free Extension
//
//  Created by Beytullah Günaydın on 18.03.2026.
//

import SafariServices
import AppKit
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    private var activeColorSampler: Any?
    private var activeContext: NSExtensionContext?

    private func hexString(from color: NSColor) -> String? {
        guard let rgb = color.usingColorSpace(.sRGB) else {
            return nil
        }

        let red = Int(round(rgb.redComponent * 255.0))
        let green = Int(round(rgb.greenComponent * 255.0))
        let blue = Int(round(rgb.blueComponent * 255.0))

        return String(format: "#%02X%02X%02X", red, green, blue)
    }

    private func buildResponse(_ payload: [String: Any]) -> NSExtensionItem {
        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: payload]
        } else {
            response.userInfo = ["message": payload]
        }

        return response
    }

    private func complete(_ context: NSExtensionContext, payload: [String: Any]) {
        let response = buildResponse(payload)
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }

    private func startNativeColorSampling(with context: NSExtensionContext) {
        guard #available(macOS 10.15, *) else {
            complete(context, payload: [
                "ok": false,
                "error": "Native color picker requires macOS 10.15 or newer."
            ])
            return
        }

        DispatchQueue.main.async {
            self.activeContext = context
            let sampler = NSColorSampler()
            self.activeColorSampler = sampler

            sampler.show { color in
                defer {
                    self.activeColorSampler = nil
                    self.activeContext = nil
                }

                guard let activeContext = self.activeContext else {
                    return
                }

                guard let color = color, let hex = self.hexString(from: color) else {
                    self.complete(activeContext, payload: ["ok": false, "canceled": true])
                    return
                }

                let pasteboard = NSPasteboard.general
                pasteboard.clearContents()
                let copied = pasteboard.setString(hex, forType: .string)

                self.complete(activeContext, payload: ["ok": true, "color": hex, "copied": copied])
            }
        }
    }

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")

        if let payload = message as? [String: Any],
           let type = payload["type"] as? String,
           type == "PICK_COLOR" {
            startNativeColorSampling(with: context)
            return
        }

        complete(context, payload: ["ok": true, "echo": message as Any])
    }

}
