const { EnvironmentError } = require("./exceps")

// https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-plugin-feed
class GatsbyPluginFeed {
  static getFeedSetup() {
    const queryResponsibleToRetrievePosts = `
      {
        allMarkdownRemark(sort: {order: DESC, fields: [frontmatter___date]}, filter: {frontmatter: {tags: {ne: null}}}) {
          edges {
            node {
              id
              fields {
                path
              }
              frontmatter {
                title
                description
                date
              }
              excerpt(truncate: true, pruneLength: 500, format: HTML)
            }
          }
        }
      }
    `
    const createNodesHandler = ({ query: { site, allMarkdownRemark } }) => {
      return allMarkdownRemark.edges.map(edge => {
        const postUrl = `${site.siteMetadata.siteUrl}${edge.node.fields.path}`
        const postId = edge.node.id
        const firstSourceObjectToCopy = edge.node.frontmatter
        const secondSourceObjectToCopy = {
          url: postUrl,
          guid: postId,
          custom_elements: [{ "content:encoded": edge.node.excerpt }],
        }
        const target = {}

        return Object.assign(target, firstSourceObjectToCopy, secondSourceObjectToCopy)
      })
    }

    return {
      serialize: createNodesHandler,
      query: queryResponsibleToRetrievePosts,
    }
  }

  static applyOptions(siteName) {
    return {
      feeds: [
        {
          output: "/rss.xml",
          title: `${siteName}'s RSS Feed`,
          ...GatsbyPluginFeed.getFeedSetup(),
        },
      ],
    }
  }
}

// Only statically analysable expressions are replaced by Webpack, thus I can't use process.env['ENV_NAME']
// https://github.com/webpack/webpack/issues/6091#issuecomment-350840578
function getEnvOrRaiseException(envName, envValue) {
  if (!envValue) throw new EnvironmentError(`Environment variable ${envName} is not set!`)

  return envValue
}

function evalEnvAsBoolean(envValue, standardValue = null) {
  if (!envValue && standardValue) return standardValue
  if (!envValue) return false

  const valueAsLowerCase = envValue.toLowerCase()
  const trueValues = ["true", "t", "y", "yes", "1"]
  return trueValues.includes(valueAsLowerCase)
}

function findValue(v1, v2) {
  return [v1, v2].filter(v => v)[0]
}

const SITE_URL = getEnvOrRaiseException("SITE_URL", findValue(process.env.SITE_URL, process.env.GATSBY_SITE_URL))
const UTTERANCES_REPOSITORY = getEnvOrRaiseException(
  "UTTERANCES_REPOSITORY",
  findValue(process.env.UTTERANCES_REPOSITORY, process.env.GATSBY_UTTERANCES_REPOSITORY)
)
const TARGET_REPO_BRANCH_CONTRIBUTION = getEnvOrRaiseException(
  "TARGET_REPO_BRANCH_CONTRIBUTION",
  findValue(process.env.TARGET_REPO_BRANCH_CONTRIBUTION, process.env.GATSBY_TARGET_REPO_BRANCH_CONTRIBUTION)
)

const NETLIFY_CMS_LOCAL_BACKEND = evalEnvAsBoolean(
  findValue(process.env.NETLIFY_CMS_LOCAL_BACKEND, process.env.GATSBY_NETLIFY_CMS_LOCAL_BACKEND),
  false
)
const NETLIFY_CMS_BACKEND_REPO = getEnvOrRaiseException(
  "NETLIFY_CMS_BACKEND_REPO",
  findValue(process.env.NETLIFY_CMS_BACKEND_REPO, process.env.GATSBY_NETLIFY_CMS_BACKEND_REPO)
)
const NETLIFY_CMS_BACKEND_BRANCH = getEnvOrRaiseException(
  "NETLIFY_CMS_BACKEND_BRANCH",
  findValue(process.env.NETLIFY_CMS_BACKEND_BRANCH, process.env.GATSBY_NETLIFY_CMS_BACKEND_BRANCH)
)

module.exports = {
  SITE_URL,
  UTTERANCES_REPOSITORY,
  TARGET_REPO_BRANCH_CONTRIBUTION,
  NETLIFY_CMS_LOCAL_BACKEND,
  NETLIFY_CMS_BACKEND_REPO,
  NETLIFY_CMS_BACKEND_BRANCH,
  GatsbyPluginFeed,
}
