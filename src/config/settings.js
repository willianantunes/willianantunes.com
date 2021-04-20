const { EnvironmentError } = require("./exceps")

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

const SITE_URL = getEnvOrRaiseException("SITE_URL", process.env.SITE_URL)

const GOOGLE_TAG_MANAGER_ID = getEnvOrRaiseException("GOOGLE_TAG_MANAGER_ID", process.env.GOOGLE_TAG_MANAGER_ID)
const GTM_INCLUDE_DEVELOPMENT = evalEnvAsBoolean(process.env.GTM_INCLUDE_DEVELOPMENT, false)

const NETLIFY_CMS_LOCAL_BACKEND = evalEnvAsBoolean(process.env.NETLIFY_CMS_LOCAL_BACKEND, false)
const NETLIFY_CMS_BACKEND_REPO = getEnvOrRaiseException("NETLIFY_CMS_BACKEND_REPO", process.env.NETLIFY_CMS_BACKEND_REPO)
const NETLIFY_CMS_BACKEND_BRANCH = getEnvOrRaiseException("NETLIFY_CMS_BACKEND_BRANCH", process.env.NETLIFY_CMS_BACKEND_BRANCH)

module.exports = {
  SITE_URL,
  GOOGLE_TAG_MANAGER_ID,
  GTM_INCLUDE_DEVELOPMENT,
  NETLIFY_CMS_LOCAL_BACKEND,
  NETLIFY_CMS_BACKEND_REPO,
  NETLIFY_CMS_BACKEND_BRANCH,
}
