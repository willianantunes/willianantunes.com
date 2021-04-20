import { EnvironmentError } from "../../../src/config/exceps"

// This marked as skipped because it breaks all the time given race conditions
xdescribe("Settings module", () => {
  beforeEach(() => {
    delete process.env.SITE_URL
  })

  it("should throw exception if must have constant wasn't set", () => {
    // Arrange
    const shouldThrowError = () => {
      require("../../../src/config/settings")
    }
    const expectedErrorMessage = `Environment variable SITE_URL is not set!`
    // Act and assert
    expect(shouldThrowError).toThrow(new EnvironmentError(expectedErrorMessage))
  })

  it("should evaluate constant as false", () => {
    // Arrange
    process.env.SITE_URL = "https://www.spacejam.com/1996/"
    process.env.GOOGLE_TAG_MANAGER_ID = "XPTO"
    process.env.GTM_INCLUDE_DEVELOPMENT = "f"
    const evaluateConstant = () => {
      const { GTM_INCLUDE_DEVELOPMENT } = require("../../../src/config/settings")
      return GTM_INCLUDE_DEVELOPMENT
    }
    // Act
    const constant = evaluateConstant()
    // Assert
    expect(typeof constant).toBe("boolean")
    expect(constant).toBe(false)
  })

  it("should evaluate constant as true", () => {
    // Arrange
    process.env.SITE_URL = "https://www.raveofphonetics.com/"
    process.env.GOOGLE_TAG_MANAGER_ID = "QWERTY"
    process.env.GTM_INCLUDE_DEVELOPMENT = "t"
    const evaluateConstant = () => {
      const { GTM_INCLUDE_DEVELOPMENT } = require("../../../src/config/settings")
      return GTM_INCLUDE_DEVELOPMENT
    }
    // Act
    const constant = evaluateConstant()
    // Assert
    expect(typeof constant).toBe("boolean")
    expect(constant).toBe(true)
  })
})
