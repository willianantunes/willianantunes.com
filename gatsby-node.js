const { BlogNodeHandler, PageNodeHandler } = require("./src/config/gatsby-node-handlers")

exports.createPages = async ({ graphql, actions, reporter }) => {
  // https://www.gatsbyjs.com/docs/reference/config-files/actions/#createPage
  const { createPage } = actions

  await BlogNodeHandler.createPagesHandler(graphql, createPage)
  await PageNodeHandler.createPagesHandler(graphql, createPage)
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  // https://www.gatsbyjs.com/docs/reference/config-files/actions/#createNodeField
  const { createNodeField } = actions

  BlogNodeHandler.createNodeHandler(createNodeField, getNode, node)
}
