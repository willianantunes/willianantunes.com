import React, { createRef } from "react"
import SEO from "../components/SEO"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import { useSiteMetadata } from "../hooks/use-site-metadata"
import BlogPost from "../components/BlogPost"
import CommentSection from "../components/CommentSection"
import { groupLevels } from "../business/posts-dealer"

const BlogPostTemplate = ({ data }) => {
  const { siteUrl } = useSiteMetadata()
  const commentSectionRef = createRef()
  // TODO: previousPost and nextPost should be used!
  const { previousPost, nextPost, markdownRemark: currentPost } = data

  const description = currentPost.frontmatter.description
  const date = currentPost.frontmatter.date
  const formattedDate = currentPost.frontmatter.formattedDate
  const title = currentPost.frontmatter.title
  const tags = currentPost.frontmatter.tags
  const content = currentPost.html
  const timeToRead = currentPost.timeToRead
  const image = `${siteUrl}${currentPost.frontmatter.cover.publicURL}`
  const groupedLevels = groupLevels(currentPost.headings)

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
        headings={groupedLevels}
      />
      <CommentSection reactRef={commentSectionRef} />
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
      headings {
        id
        value
        depth
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
