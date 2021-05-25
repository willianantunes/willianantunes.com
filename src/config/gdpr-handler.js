import { get as getCookie, set as setCookie } from "cookies-js"
import { GOOGLE_TAG_MANAGER_ID } from "./settings"

function installGTM(googleTagManagerId) {
  ;(function (w, d, s, l, i) {
    w[l] = w[l] || []
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" })
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : ""
    j.async = true
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl
    if (f) f.parentNode.insertBefore(j, f)
  })(window, document, "script", "dataLayer", googleTagManagerId)
}

export class GeneralDataProtectionRegulationHandler {
  static #cookieName = "gdpr-allowed-to-collect"
  static #cookieExpiration365DaysInSeconds = 60 * 60 * 24 * 365
  static #initializationCompleted = false

  static userHasntBeenAsked() {
    return !!!getCookie(this.#cookieName)
  }

  static initializeGoogleTagManagerIfAllowed() {
    if (this.#initializationCompleted === false) {
      const allowedToCollectData = getCookie(this.#cookieName) === `true`
      const canInitializeGTM = allowedToCollectData && GOOGLE_TAG_MANAGER_ID
      if (canInitializeGTM) {
        console.log("Initializing GTM 😲")
        installGTM(GOOGLE_TAG_MANAGER_ID)
        this.#initializationCompleted = true
      }
    }
  }

  static cookieConsentAccepted() {
    setCookie(this.#cookieName, "true", { expires: this.#cookieExpiration365DaysInSeconds })
  }

  static cookieConsentDeclined() {
    setCookie(this.#cookieName, "false", { expires: this.#cookieExpiration365DaysInSeconds })
  }

  static configureInitializationCompletedAsFalse() {
    this.#initializationCompleted = false
  }
}
