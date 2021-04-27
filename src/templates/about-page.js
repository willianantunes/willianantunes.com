import React from "react"
import SEO from "../components/SEO"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import BlogPost from "../components/BlogPost"

const AboutPage = ({ data }) => {
  const { markdownRemark: page } = data

  const title = page.frontmatter.title
  const content = page.html

  return (
    <Layout>
      <SEO title={title} />
      <BlogPost title={title} content={content} />
    </Layout>
  )
}

export const query = graphql`
  query($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
      }
    }
  }
`

export default AboutPage
