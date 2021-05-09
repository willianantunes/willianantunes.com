import React, { useEffect } from "react"
import * as S from "./styled"
import { paletteTypeDark, useDarkThemeContext } from "../../contexts/dark-theme-context"
import { UTTERANCES_REPOSITORY } from "../../config/settings.js"

export default function CommentSection({ reactRef }) {
  const { paletteType } = useDarkThemeContext()

  useEffect(() => {
    const commentScript = document.createElement("script")
    const theme = paletteType === paletteTypeDark ? "github-dark" : "github-light"
    commentScript.async = true
    commentScript.src = "https://utteranc.es/client.js"
    commentScript.setAttribute("repo", UTTERANCES_REPOSITORY)
    commentScript.setAttribute("issue-term", "pathname")
    commentScript.setAttribute("id", "utterances")
    commentScript.setAttribute("theme", theme)
    commentScript.setAttribute("crossorigin", "anonymous")
    if (reactRef && reactRef.current) {
      reactRef.current.appendChild(commentScript)
    } else {
      console.log(`Error adding utterances comments on: ${reactRef}`)
    }

    const cleanUpFunctionToRemoveCommentSection = () => {
      commentScript.remove()
      document.querySelectorAll(".utterances").forEach(el => el.remove())
    }

    return cleanUpFunctionToRemoveCommentSection
  }, [paletteType])

  return <S.MainWrapper ref={reactRef} />
}
