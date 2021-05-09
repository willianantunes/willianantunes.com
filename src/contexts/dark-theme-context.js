import React from "react"

export const paletteTypeLight = "light"
export const paletteTypeDark = "dark"
export const paletteTypeLocalStorageKey = "custom-palette-type"
const mediaQueryColorTheme = `(prefers-color-scheme: ${paletteTypeDark})`

const DarkThemeContext = React.createContext(null)
const useDarkThemeContext = () => React.useContext(DarkThemeContext)

function currentTheme() {
  const prefersDark = typeof window !== "undefined" && window.matchMedia(mediaQueryColorTheme).matches

  try {
    const themeInWindow = typeof window !== "undefined" && localStorage.getItem(paletteTypeLocalStorageKey)
    if (themeInWindow) {
      return localStorage.getItem(paletteTypeLocalStorageKey)
    }
  } catch (exceptionToBeIgnored) {}

  return prefersDark ? paletteTypeDark : paletteTypeLight
}

function DarkThemeProvider({ children }) {
  const themeToUse = currentTheme()
  const [paletteType, setPaletteType] = React.useState(themeToUse)
  const properties = { paletteType, setPaletteType }

  return <DarkThemeContext.Provider value={properties}>{children}</DarkThemeContext.Provider>
}

function wrapWithDarkThemeProvider({ element }) {
  return <DarkThemeProvider>{element}</DarkThemeProvider>
}

export { useDarkThemeContext, wrapWithDarkThemeProvider }
