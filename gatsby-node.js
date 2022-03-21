const { BlogNodeHandler, PageNodeHandler } = require("./src/config/gatsby-node-handlers")

exports.createPages = async ({ graphql, actions, reporter }) => {
  // https://www.gatsbyjs.com/docs/reference/config-files/actions/#createPage
  // https://www.gatsbyjs.com/docs/reference/config-files/actions/#createRedirect
  const { createPage, createRedirect } = actions

  createRedirect({
    fromPath: "/blog/2022/03/blog-18-caching-jwks-using-redis-with-django",
    toPath: "/blog/2022/03/caching-jwks-using-redis-with-django",
    isPermanent: true,
  })

  await BlogNodeHandler.createPagesHandler(graphql, createPage)
  await PageNodeHandler.createPagesHandler(graphql, createPage)
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  // https://www.gatsbyjs.com/docs/reference/config-files/actions/#createNodeField
  const { createNodeField } = actions

  BlogNodeHandler.createNodeHandler(createNodeField, getNode, node)
}
