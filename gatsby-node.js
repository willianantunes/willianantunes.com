const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const { fmImagesToRelative } = require("gatsby-remark-relative-images")

function extractsTitleFromPostLocation(location) {
  const regex = /\/[0-9]+\/[0-9]+\/(.+)\//
  const [fullMatch, firstGroup] = location.match(regex)
  return firstGroup
}

exports.createPages = async ({ graphql, actions, reporter }) => {
  // https://www.gatsbyjs.com/docs/reference/config-files/actions/#createPage
  const { createPage } = actions

  // Define a template for blog post
  const blogPost = path.resolve(`./src/templates/blog-post.js`)

  const resultMarkdownPostsTotalCount = await graphql(`
    {
      allMarkdownRemark {
        totalCount
      }
    }
  `)

  const mustProcessPosts = resultMarkdownPostsTotalCount.data.allMarkdownRemark.totalCount > 0

  if (mustProcessPosts) {
    const resultMarkdownPostsSortedByDate = await graphql(`
      {
        allMarkdownRemark(sort: { fields: [frontmatter___date], order: ASC }, limit: 1000) {
          nodes {
            id
            fields {
              slug
              path
            }
          }
        }
      }
    `)

    const posts = resultMarkdownPostsSortedByDate.data.allMarkdownRemark.nodes

    posts.forEach((post, index) => {
      const previousPostId = index === 0 ? null : posts[index - 1].id
      const nextPostId = index === posts.length - 1 ? null : posts[index + 1].id

      const { path } = post.fields

      createPage({
        path: path,
        component: blogPost,
        context: {
          id: post.id,
          previousPostId,
          nextPostId,
        },
      })
    })
  }
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  // https://www.gatsbyjs.com/docs/reference/config-files/actions/#createNodeField
  const { createNodeField } = actions
  fmImagesToRelative(node)

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    const markdownFileName = extractsTitleFromPostLocation(value)
    const yearAndMonth = markdownFileName.slice(0, 10).replace("-", "/").split("-")[0]
    const sluggedTitleWithoutTheDatePart = markdownFileName.slice(11)
    const path = `/blog/${yearAndMonth}/${sluggedTitleWithoutTheDatePart}/`

    createNodeField({
      name: `slug`,
      node,
      value: markdownFileName,
    })
    createNodeField({
      name: `path`,
      node,
      value: path,
    })
  }
}
