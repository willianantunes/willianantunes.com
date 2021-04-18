const { EnvironmentError } = require("./exceps")

function getEnvOrRaiseException(envName) {
  const value = process.env[envName]

  if (!value) throw new EnvironmentError(`Environment variable ${envName} is not set!`)

  return value
}

function evalEnvAsBoolean(envName, standardValue = null) {
  const value = process.env[envName]

  if (!value && standardValue) return standardValue

  const valueAsLowerCase = value.toLowerCase()
  const trueValues = ["true", "t", "y", "yes", "1"]
  return trueValues.includes(valueAsLowerCase)
}

const SITE_URL = getEnvOrRaiseException("SITE_URL")
const GOOGLE_TAG_MANAGER_ID = getEnvOrRaiseException("GOOGLE_TAG_MANAGER_ID")
const GTM_INCLUDE_DEVELOPMENT = evalEnvAsBoolean("GTM_INCLUDE_DEVELOPMENT")

module.exports = {
  SITE_URL,
  GOOGLE_TAG_MANAGER_ID,
  GTM_INCLUDE_DEVELOPMENT,
}
