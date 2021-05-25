import "prismjs/themes/prism-tomorrow.css"
import { wrapWithDarkThemeProvider } from "./src/contexts/dark-theme-context"
import { GeneralDataProtectionRegulationHandler } from "./src/config/gdpr-handler"

// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/#wrapRootElement
export const wrapRootElement = wrapWithDarkThemeProvider

// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/#onRouteUpdate
export const onRouteUpdate = () => {
  GeneralDataProtectionRegulationHandler.initializeGoogleTagManagerIfAllowed()
}
