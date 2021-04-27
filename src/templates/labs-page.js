import React from "react"
import SEO from "../components/SEO"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import ListOfGalleryEntries from "../components/ListOfGalleryEntries"

const LabsPage = ({ data }) => {
  const { markdownRemark: page } = data
  const pageTitle = page.frontmatter.title
  const galleryEntries = page.frontmatter.galleryLabs

  return (
    <Layout>
      <SEO title={pageTitle} />
      <ListOfGalleryEntries entries={galleryEntries} />
    </Layout>
  )
}

export const query = graphql`
  query($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        galleryLabs {
          date
          title
          projectLink
          description
          cover {
            publicURL
          }
        }
      }
    }
  }
`

export default LabsPage
