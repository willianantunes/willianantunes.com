import React from "react"
import { render } from "../../../support/test-utils"
import { screen } from "@testing-library/react"
import GDPRConsent from "../../../../src/components/GDPRConsent"
import { GeneralDataProtectionRegulationHandler } from "../../../../src/config/gdpr-handler"

jest.mock("../../../../src/config/gdpr-handler")

describe("GDPRConsent component", () => {
  it("is rendered properly", async () => {
    // Arrange
    const fakeUserWasNotAsked = jest.fn().mockReturnValue(true)
    GeneralDataProtectionRegulationHandler.userHasntBeenAsked = fakeUserWasNotAsked
    // Act
    render(<GDPRConsent />)
    // Assert
    const testId = "gdpr-consent-snackbar"
    const element = await screen.findByTestId(testId)
    expect(fakeUserWasNotAsked).toBeCalled()
    const expectedText = `This website stores cookies 🍪 on your computer only if you allow them.`
    expect(element.textContent).toContain(expectedText)
  })
})
