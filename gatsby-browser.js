import "prismjs/themes/prism-tomorrow.css"
import React from "react"
import { wrapWithDarkThemeProvider } from "./src/contexts/dark-theme-context"

export const wrapRootElement = wrapWithDarkThemeProvider
