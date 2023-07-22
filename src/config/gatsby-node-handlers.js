const path = require(`path`)
const traverse = require(`traverse`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const { isString } = require("./utils")

class BlogNodeHandler {
  static blogPostTemplate = path.resolve(`./src/templates/blog-post.js`)

  static extractsTitleFromPostLocation(location) {
    const regex = /\/[0-9]+\/[0-9]+\/(.+)\//
    const [fullMatch, firstGroup] = location.match(regex)
    return firstGroup
  }

  static async createPagesHandler(graphqlCallable, createPageCallable) {
    const resultMarkdownPostsTotalCount = await graphqlCallable(`
      {
        allMarkdownRemark(filter: {frontmatter: {tags: {ne: null}}}) {
          totalCount
        }
      }    
    `)
    const hasPostsToBeProcessed = resultMarkdownPostsTotalCount.data.allMarkdownRemark.totalCount > 0

    if (hasPostsToBeProcessed) {
      const resultMarkdownPostsSortedByDate = await graphqlCallable(`
        {
          allMarkdownRemark(
            sort: {fields: [frontmatter___date], order: ASC}
            limit: 1000
            filter: {frontmatter: {tags: {ne: null}}}
          ) {
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

        createPageCallable({
          path: path,
          component: BlogNodeHandler.blogPostTemplate,
          context: {
            id: post.id,
            previousPostId,
            nextPostId,
          },
        })
      })
    }
  }

  static createNodeHandler(createNodeFieldCallable, getNodeCallable, node) {
    const isBlogPost = node.frontmatter?.tags !== undefined

    if (node.internal.type === `MarkdownRemark` && isBlogPost) {
      const value = createFilePath({ node, getNode: getNodeCallable })
      const markdownFileName = BlogNodeHandler.extractsTitleFromPostLocation(value)
      const yearAndMonth = markdownFileName.slice(0, 10).replace("-", "/").split("-")[0]
      const sluggedTitleWithoutTheDatePart = markdownFileName.slice(11)
      const path = `/blog/${yearAndMonth}/${sluggedTitleWithoutTheDatePart}/`

      createNodeFieldCallable({
        name: `slug`,
        node,
        value: markdownFileName,
      })
      createNodeFieldCallable({
        name: `path`,
        node,
        value: path,
      })
    }
  }
}

class PageNodeHandler {
  static async createPagesHandler(graphqlCallable, createPageCallable) {
    const pagesMetadata = await graphqlCallable(`
      {
        allMarkdownRemark(limit: 1000, filter: {frontmatter: {tags: {eq: null}}}) {
          nodes {
            id
            frontmatter {
              path
              templateFileName
            }
          }
        }
      }
    `)

    const pages = pagesMetadata.data.allMarkdownRemark.nodes

    pages.forEach(page => {
      const id = page.id
      const pathWhereItCanBeAccessed = page.frontmatter.path
      const templateFileName = page.frontmatter.templateFileName
      const additionalDataToPassViaContext = { id }

      createPageCallable({
        path: pathWhereItCanBeAccessed,
        component: path.resolve(`./src/templates/${templateFileName}.js`),
        context: additionalDataToPassViaContext,
      })
    })
  }
}

/**
 * Why I had to create it?
 * https://www.gatsbyjs.com/docs/how-to/images-and-media/working-with-images-in-markdown/
 * https://github.com/danielmahon/gatsby-remark-relative-images/issues/61
 */
class RemarkRelativeImages {
  static createNodeHandler(createNodeFieldCallable, node) {
    const eligibleToBeProcessed = node.fileAbsolutePath && node.internal.type === `MarkdownRemark`
    if (eligibleToBeProcessed) {
      const isBlogPost = node?.frontmatter?.cover?.includes("posts/blog")
      if (isBlogPost) {
        traverse(node.frontmatter).forEach(function (value) {
          const validFilePath = isString(value) && path.isAbsolute(value)
          if (validFilePath) {
            const newValue = value.replace("/assets/posts/", "../../../../static/assets/posts/")
            this.update(newValue)
          }
        })
        createNodeFieldCallable({
          node,
          name: `frontmatter`,
          value: node.frontmatter,
        })
      } else {
        const galleryLabs = node.frontmatter?.galleryLabs
        if (galleryLabs) {
          for (const index in galleryLabs) {
            const newValue = galleryLabs[index].cover.replace("/assets/posts/", "../../static/assets/posts/")
            galleryLabs[index].cover = newValue
          }
          createNodeFieldCallable({
            node,
            name: "frontmatter",
            value: node.frontmatter,
          })
        }
      }
    }
  }
}

module.exports = {
  BlogNodeHandler,
  PageNodeHandler,
  RemarkRelativeImages,
}
