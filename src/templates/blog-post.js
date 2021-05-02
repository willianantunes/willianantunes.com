import React, { createRef, useEffect } from "react"
import SEO from "../components/SEO"
import { graphql } from "gatsby"
import Layout from "../components/Layout"
import { useSiteMetadata } from "../hooks/use-site-metadata"
import BlogPost from "../components/BlogPost"
import CommentSection from "../components/CommentSection"
import { isCurrentThemeDark } from "../business/dark-mode-strategy"

const BlogPostTemplate = ({ data }) => {
  const { siteUrl } = useSiteMetadata()
  // TODO: previousPost and nextPost should be used!
  const { previousPost, nextPost, markdownRemark: currentPost } = data
  const commentSectionRef = createRef()

  useEffect(() => {
    const commentScript = document.createElement("script")
    // TODO: When the user changes theme, this should be updated too
    const theme = typeof window !== "undefined" && isCurrentThemeDark() ? "github-dark" : "github-light"
    commentScript.async = true
    commentScript.src = "https://utteranc.es/client.js"
    // TODO: Use ENV variables for it
    commentScript.setAttribute("repo", "willianantunes/comments")
    commentScript.setAttribute("issue-term", "pathname")
    commentScript.setAttribute("id", "utterances")
    commentScript.setAttribute("theme", theme)
    commentScript.setAttribute("crossorigin", "anonymous")
    if (commentSectionRef && commentSectionRef.current) {
      commentSectionRef.current.appendChild(commentScript)
    } else {
      console.log(`Error adding utterances comments on: ${commentSectionRef}`)
    }
  }, [])

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
