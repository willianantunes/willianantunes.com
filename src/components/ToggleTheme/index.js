import React, { useEffect, useState } from "react"
import * as S from "./styled"
import { Helmet } from "react-helmet/es/Helmet"
import { isCurrentThemeDark, toggleTheme } from "../../business/dark-mode-strategy"

export default function ToggleTheme() {
  const [isDarkMode, setIsDarkMode] = useState(null)

  function evaluateCurrentTheme() {
    const evaluation = isCurrentThemeDark()
    setIsDarkMode(evaluation)
    return evaluation
  }

  useEffect(() => {
    evaluateCurrentTheme()
  }, [])

  const onClick = () => {
    // Please see dark-mode-strategy.js to understand what is going on
    toggleTheme()
    // So the component can be rendered properly
    evaluateCurrentTheme()
    // To refresh DISQUS
    if (window && window.DISQUS !== undefined) {
      window.setTimeout(() => window.DISQUS.reset({ reload: true }), 600)
    }
  }

  return (
    <S.ToggleTheme data-testid="button-toggle-theme" active={isDarkMode} onClick={onClick}>
      <Helmet>
        <body className={isDarkMode ? "theme-dark" : "theme-light"} />
      </Helmet>
      <S.ToggleThemeTrack />
    </S.ToggleTheme>
  )
}
