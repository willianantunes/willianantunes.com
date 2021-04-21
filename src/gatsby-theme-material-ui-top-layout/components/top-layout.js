import React, { useMemo } from "react"
import { ThemeProvider as StyledComponentsThemeProvider } from "styled-components"
import { ThemeProvider as MuiThemeProvider } from "@material-ui/styles"
import CssBaseline from "@material-ui/core/CssBaseline"
import Viewport from "gatsby-theme-material-ui-top-layout/src/components/viewport"
import { createMuiTheme } from "@material-ui/core"
import { themeConfiguration } from "../theme"
import { useWindowDarkModeStrategy } from "../../business/dark-mode-strategy"

// Sadly the injected theme can't be updated, that is why I import the one in theme.js
export default function TopLayout({ children }) {
  // https://material-ui.com/customization/palette/#user-preference
  const paletteType = useWindowDarkModeStrategy()

  const memoizedTheme = useMemo(() => {
    themeConfiguration.palette.type = paletteType
    return createMuiTheme(themeConfiguration)
  }, [paletteType])

  return (
    <>
      <Viewport />
      <MuiThemeProvider theme={memoizedTheme}>
        {/* https://material-ui.com/guides/interoperability/#theme */}
        <StyledComponentsThemeProvider theme={memoizedTheme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </StyledComponentsThemeProvider>
      </MuiThemeProvider>
    </>
  )
}
