//
//  ViewController.swift
//  Web Element Tool
//
//  Created by Beytullah Günaydın on 18.03.2026.
//

import Cocoa
import SafariServices
import WebKit

let extensionBundleIdentifier = "yunsoft.WebElementTool.Extension"

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                if #available(macOS 13, *) {
                    webView.evaluateJavaScript("show(\(state.isEnabled), true)")
                } else {
                    webView.evaluateJavaScript("show(\(state.isEnabled), false)")
                }
            }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let command = message.body as? String, command == "open-preferences" else {
            return
        }

        setOpenInProgress(true)

        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { [weak self] error in
            DispatchQueue.main.async {
                self?.setOpenInProgress(false)

                guard let error else {
                    return
                }

                self?.presentOpenSettingsError(error)
            }
        }
    }

    private func setOpenInProgress(_ isOpening: Bool) {
        webView.evaluateJavaScript("setOpenInProgress(\(isOpening))")
    }

    private func presentOpenSettingsError(_ error: Error) {
        let alert = NSAlert(error: error)
        alert.runModal()
    }

}
