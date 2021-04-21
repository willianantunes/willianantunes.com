import React from "react"
import PropTypes from "prop-types"
import { Disqus } from "gatsby-plugin-disqus"
import * as S from "./styled"
import { useSiteMetadata } from "../../hooks/use-site-metadata"
import { useLocation } from "@reach/router"

const DisqusWrapper = ({ identifier, title }) => {
  const { siteUrl } = useSiteMetadata()
  const { pathname } = useLocation()

  const disqusConfig = {
    url: `${siteUrl + pathname}`,
    identifier: identifier,
    title: title,
  }

  return (
    <S.DisqusWrapper>
      <Disqus config={disqusConfig} />
    </S.DisqusWrapper>
  )
}

DisqusWrapper.propTypes = {
  identifier: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
}

export default DisqusWrapper
