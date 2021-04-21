import { useEffect, useState } from "react"
import { useMediaQuery } from "@material-ui/core"

export const paletteTypeLight = "light"
export const paletteTypeDark = "dark"
export const windowKeyCurrentTheme = "__theme"
export const windowKeyOnThemeChangeFunctionName = "__onThemeChange"
export const windowKeyOnToggleThemeFunctionName = "__toggleTheme"
export const mediaQueryColorTheme = `(prefers-color-scheme: ${paletteTypeDark})`

export function useWindowDarkModeStrategy() {
  const isSSR = typeof window !== "undefined"

  const prefersDarkMode = useMediaQuery(mediaQueryColorTheme)
  const initialState = isSSR ? paletteTypeLight : prefersDarkMode ? paletteTypeDark : paletteTypeLight
  const [paletteType, setPaletteType] = useState(initialState)

  useEffect(() => {
    setPaletteType(window[windowKeyCurrentTheme])
    // This function will be responsible to render this again given the state update
    // window[windowKeyCurrentTheme] must be evaluated all the time
    window[windowKeyOnThemeChangeFunctionName] = () => setPaletteType(window[windowKeyCurrentTheme])
  }, [])

  return paletteType
}

export function initializeDarkThemeStrategy() {
  const paletteTypeLocalStorageKey = "custom-palette-type"
  // Just a mock function. Actually it will be updated in useWindowDarkModeStrategy function
  window[windowKeyOnThemeChangeFunctionName] = function () {}

  // This will be called in your React code!
  window[windowKeyOnToggleThemeFunctionName] = function () {
    const currentTheme = window[windowKeyCurrentTheme]
    const newTheme = currentTheme ? (currentTheme === paletteTypeLight ? paletteTypeDark : paletteTypeLight) : paletteTypeLight
    setDesirablePaletteType(newTheme)
    try {
      localStorage.setItem(paletteTypeLocalStorageKey, newTheme)
    } catch (err) {}

    return newTheme
  }

  function setDesirablePaletteType(newPaletteType) {
    window[windowKeyCurrentTheme] = newPaletteType
    window[windowKeyOnThemeChangeFunctionName](newPaletteType)
  }

  function configureCurrentPaletteType() {
    let usedPalletType
    try {
      usedPalletType = localStorage.getItem(paletteTypeLocalStorageKey)
    } catch (err) {}

    const userHasDarkMode = window.matchMedia && window.matchMedia(mediaQueryColorTheme).matches

    if (userHasDarkMode) {
      setDesirablePaletteType(usedPalletType || paletteTypeDark)
    } else {
      setDesirablePaletteType(usedPalletType || paletteTypeLight)
    }
  }

  configureCurrentPaletteType()
}

export function toggleTheme() {
  window[windowKeyOnToggleThemeFunctionName]()
}

export function isCurrentThemeDark() {
  return window[windowKeyCurrentTheme] === paletteTypeDark
}
