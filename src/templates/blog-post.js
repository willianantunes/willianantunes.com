import React, { createRef } from "react"
import SEO from "../components/SEO"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import { useSiteMetadata } from "../hooks/use-site-metadata"
import BlogPost from "../components/BlogPost"
import CommentSection from "../components/CommentSection"
import { groupLevels } from "../business/posts-dealer"
import PreviousNextEntries from "../components/PreviousNextEntries"
import ContributionDetails from "../components/ContributionDetails"
import { Divider } from "@material-ui/core"

const BlogPostTemplate = ({ data }) => {
  const commentSectionRef = createRef()
  const { siteUrl } = useSiteMetadata()
  const { previous: previousPost, next: nextPost, markdownRemark: currentPost } = data

  const fileAbsolutePath = currentPost.fileAbsolutePath
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
      <Divider />
      <ContributionDetails pathWhereEntryIsSaved={fileAbsolutePath} />
      {(previousPost || nextPost) && <PreviousNextEntries previousEntry={previousPost} nextEntry={nextPost} />}
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
      fileAbsolutePath
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
      fields {
        path
      }
    }
    previous: markdownRemark(id: { eq: $previousPostId }) {
      fields {
        path
      }
      frontmatter {
        formattedDate: date(formatString: "MMMM DD, YYYY")
        date
        title
      }
    }
    next: markdownRemark(id: { eq: $nextPostId }) {
      fields {
        path
      }
      frontmatter {
        formattedDate: date(formatString: "MMMM DD, YYYY")
        date
        title
      }
    }
  }
`
