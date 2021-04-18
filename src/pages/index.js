import React from "react"
import Layout from "../components/Layout"
import SEO from "../components/SEO"
import { graphql } from "gatsby"
import { groupByYear } from "../business/posts-dealer"
import ListOfBlogEntries from "../components/ListOfBlogEntries"

const IndexPage = ({ data }) => {
  const title = "Home"
  const posts = data.allMarkdownRemark.nodes
  const postsGroupedByYear = groupByYear(posts)

  const AllBlogEntries = () => {
    return postsGroupedByYear.map(({ year, posts }, index) => {
      return <ListOfBlogEntries key={index} year={year} posts={posts} />
    })
  }

  return (
    <Layout>
      <SEO title={title} />
      <AllBlogEntries />
    </Layout>
  )
}

export const query = graphql`
  {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        excerpt
        fields {
          slug
          path
        }
        frontmatter {
          id
          date: date
          formattedDate: date(formatString: "MMMM DD, YYYY")
          title
          description
          tags
        }
      }
    }
  }
`

export default IndexPage
