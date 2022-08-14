import "prismjs/themes/prism-tomorrow.css"
import { wrapWithDarkThemeProvider } from "./src/contexts/dark-theme-context"

// https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/#wrapRootElement
export const wrapRootElement = wrapWithDarkThemeProvider
