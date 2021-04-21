import React from "react"
import SEO from "../components/SEO"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import { useSiteMetadata } from "../hooks/use-site-metadata"
import BlogPost from "../components/BlogPost"
import DisqusWrapper from "../components/DisqusWrapper"

const BlogPostTemplate = ({ data }) => {
  const { siteUrl } = useSiteMetadata()

  const { previousPost, nextPost, markdownRemark: currentPost } = data

  const identifier = currentPost.frontmatter.id
  const description = currentPost.frontmatter.description
  const date = currentPost.frontmatter.date
  const formattedDate = currentPost.frontmatter.formattedDate
  const title = currentPost.frontmatter.title
  const tags = currentPost.frontmatter.tags
  const content = currentPost.html
  const timeToRead = currentPost.timeToRead
  const image = `${siteUrl}${currentPost.frontmatter.cover.publicURL}`

  return (
    <Layout>
      <SEO title={title} description={description} image={image} />
      <BlogPost
        title={title}
        date={date}
        formattedDate={formattedDate}
        content={content}
        timeToRead={timeToRead}
        tags={tags}
        image={image}
      />
      <DisqusWrapper identifier={identifier} title={title} />
    </Layout>
  )
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($id: String!, $previousPostId: String, $nextPostId: String) {
    markdownRemark(id: { eq: $id }) {
      id
      excerpt(pruneLength: 160)
      html
      timeToRead
      frontmatter {
        title
        formattedDate: date(formatString: "MMMM DD, YYYY")
        date
        description
        tags
        id
        cover {
          id
          publicURL
        }
      }
    }
    previous: markdownRemark(id: { eq: $previousPostId }) {
      fields {
        path
      }
      frontmatter {
        title
      }
    }
    next: markdownRemark(id: { eq: $nextPostId }) {
      fields {
        path
      }
      frontmatter {
        title
      }
    }
  }
`
