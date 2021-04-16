import React from "react"
import PropTypes from "prop-types"
import { Helmet } from "react-helmet"
import { useSiteMetadata } from "../../hooks/use-site-metadata"
import { graphql, useStaticQuery } from "gatsby"

const SEO = ({ description, meta, title, image }) => {
  const siteMetadata = useSiteMetadata()
  const {
    file: { publicURL: ogImage },
  } = useStaticQuery(
    graphql`
      query {
        file(name: { eq: "og-image" }) {
          publicURL
        }
      }
    `
  )

  const openGraphImage = image || `${siteMetadata.siteUrl}${ogImage}`
  const htmlAttributes = { lang: `en` }
  const descriptionToBeUsed = description || siteMetadata.description
  const defaultTitle = siteMetadata.title
  const finalTitle = `${title} | ${defaultTitle}`
  const { twitterLink } = siteMetadata.social

  return (
    <Helmet
      htmlAttributes={htmlAttributes}
      title={title}
      titleTemplate={`%s | ${defaultTitle}`}
      meta={[
        {
          name: `description`,
          content: descriptionToBeUsed,
        },
        {
          property: `og:image`,
          content: openGraphImage,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          property: `og:title`,
          content: finalTitle,
        },
        {
          property: `og:description`,
          content: descriptionToBeUsed,
        },
        {
          name: `twitter:card`,
          content: `summary`,
        },
        {
          name: `twitter:site`,
          content: twitterLink,
        },
      ].concat(meta)}
    />
  )
}

SEO.defaultProps = {
  lang: `en`,
  meta: [],
}

SEO.propTypes = {
  description: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string.isRequired,
  image: PropTypes.string,
}

export default SEO
