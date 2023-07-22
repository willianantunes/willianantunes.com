import React, { useMemo, useEffect, useState } from "react"
import { ThemeProvider as StyledComponentsThemeProvider } from "styled-components"
import { ThemeProvider as MuiThemeProvider } from "@material-ui/core"
import CssBaseline from "@material-ui/core/CssBaseline"
import Viewport from "gatsby-theme-material-ui-top-layout/src/components/viewport"
import { createTheme } from "@material-ui/core/styles"
import { themeConfiguration } from "../theme"
import { useDarkThemeContext } from "../../contexts/dark-theme-context"

// Sadly the injected theme can't be updated, that is why I import the one in theme.js
export default function TopLayout({ children }) {
  // https://material-ui.com/customization/palette/#user-preference
  const { paletteType } = useDarkThemeContext()

  const memoizedTheme = useMemo(() => {
    themeConfiguration.palette.type = paletteType
    return createTheme(themeConfiguration)
  }, [paletteType])

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // https://github.com/vercel/next.js/discussions/15003#discussioncomment-734715
    // https://www.joshwcomeau.com/react/the-perils-of-rehydration/#the-solution
    setMounted(true)
  }, [])

  return (
    <div key={String(mounted)}>
      <Viewport />
      <MuiThemeProvider theme={memoizedTheme}>
        {/* https://material-ui.com/guides/interoperability/#theme */}
        <StyledComponentsThemeProvider theme={memoizedTheme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </StyledComponentsThemeProvider>
      </MuiThemeProvider>
    </div>
  )
}
