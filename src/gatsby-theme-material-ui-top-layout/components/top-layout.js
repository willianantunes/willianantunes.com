import React from "react"
import { ThemeProvider } from "styled-components"
import CssBaseline from "@material-ui/core/CssBaseline"
import { ThemeProvider as MuiThemeProvider } from "@material-ui/styles"
import Viewport from "gatsby-theme-material-ui-top-layout/src/components/viewport"

export default function TopLayout({ children, theme }) {
  return (
    <>
      <Viewport />
      <MuiThemeProvider theme={theme}>
        {/* https://material-ui.com/guides/interoperability/#theme */}
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </ThemeProvider>
      </MuiThemeProvider>
    </>
  )
}
