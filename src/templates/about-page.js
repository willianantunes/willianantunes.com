import React from "react"
import SEO from "../components/SEO"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import BlogPost from "../components/BlogPost"
import { groupLevels } from "../business/posts-dealer"

const AboutPage = ({ data }) => {
  const { markdownRemark: page } = data

  const title = page.frontmatter.title
  const content = page.html
  const groupedLevels = groupLevels(page.headings)

  return (
    <Layout>
      <SEO title={title} />
      <BlogPost title={title} content={content} headings={groupedLevels} />
    </Layout>
  )
}

export const query = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
      }
      headings {
        id
        value
        depth
      }
    }
  }
`

export default AboutPage
