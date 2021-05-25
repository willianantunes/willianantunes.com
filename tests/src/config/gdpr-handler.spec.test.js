import { GeneralDataProtectionRegulationHandler } from "../../../src/config/gdpr-handler"
import Cookie from "cookies-js"

jest.mock("cookies-js")

describe("GDPRConsent component", () => {
  const cookieName = "gdpr-allowed-to-collect"
  const expirationTimeInSeconds = 60 * 60 * 24 * 365

  beforeEach(() => {
    jest.clearAllMocks()
    delete window.dataLayer
  })

  it("should answer the user hasn't been asked given no cookie was found", () => {
    // Arrange
    Cookie.get.mockReturnValue(true)
    // Act
    const result = GeneralDataProtectionRegulationHandler.userHasntBeenAsked()
    // Assert
    expect(result).toBe(false)
    expect(Cookie.get).toBeCalledWith(cookieName)
  })

  it("should answer the user has been asked given cookie was found", () => {
    // Arrange
    Cookie.get.mockReturnValue(false)
    // Act
    const result = GeneralDataProtectionRegulationHandler.userHasntBeenAsked()
    // Assert
    expect(result).toBe(true)
    expect(Cookie.get).toBeCalledWith(cookieName)
  })

  it("should save cookie when user has consented", () => {
    // Act
    GeneralDataProtectionRegulationHandler.cookieConsentAccepted()
    // Assert
    expect(Cookie.set).toBeCalledWith(cookieName, "true", { expires: expirationTimeInSeconds })
  })

  it("should save cookie when user hasn't consented", () => {
    // Act
    GeneralDataProtectionRegulationHandler.cookieConsentDeclined()
    // Assert
    expect(Cookie.set).toBeCalledWith(cookieName, "false", { expires: expirationTimeInSeconds })
  })

  it("should initialize gtm given user has consented", () => {
    // Arrange
    Cookie.get.mockReturnValue(`true`)
    GeneralDataProtectionRegulationHandler.configureInitializationCompletedAsFalse()
    // Act
    GeneralDataProtectionRegulationHandler.initializeGoogleTagManagerIfAllowed()
    GeneralDataProtectionRegulationHandler.initializeGoogleTagManagerIfAllowed()
    // Assert
    expect(Cookie.get).toBeCalledWith(cookieName)
    expect(Cookie.get).toBeCalledTimes(1)
    expect(window.dataLayer).toHaveLength(1)
    const dataLayerValue = window.dataLayer[0]
    const expectedDataLayerValue = {
      "gtm.start": expect.any(Number),
      event: "gtm.js",
    }
    expect(dataLayerValue).toMatchObject(expectedDataLayerValue)
  })

  it("should not initialize gtm given user hasn't consented", () => {
    // Arrange
    Cookie.get.mockReturnValue(`false`)
    GeneralDataProtectionRegulationHandler.configureInitializationCompletedAsFalse()
    // Act
    GeneralDataProtectionRegulationHandler.initializeGoogleTagManagerIfAllowed()
    GeneralDataProtectionRegulationHandler.initializeGoogleTagManagerIfAllowed()
    // Assert
    expect(Cookie.get).toBeCalledWith(cookieName)
    expect(Cookie.get).toBeCalledTimes(2)
    expect(window.dataLayer).not.toBeDefined()
  })
})
