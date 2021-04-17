import React from "react"
import * as S from "./styled"
import { useSiteMetadata } from "../../hooks/use-site-metadata"

const Footer = () => {
  const { author, projectLicense } = useSiteMetadata()
  const currentYear = new Date().getFullYear()

  return (
    <S.MainWrapper>
      <S.SmallDetailsWrapper data-testid="small-details-wrapper">
        © {currentYear} {author.name}
        <S.CustomLink to={projectLicense}>Terms & Conditions</S.CustomLink>
      </S.SmallDetailsWrapper>
    </S.MainWrapper>
  )
}

export default Footer
