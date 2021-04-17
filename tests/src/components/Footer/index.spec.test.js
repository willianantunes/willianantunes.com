import React from "react"
import { render } from "../../../support/test-utils"
import { screen } from "@testing-library/react"
import { useSiteMetadata } from "../../../../src/hooks/use-site-metadata"
import Footer from "../../../../src/components/Footer"

jest.mock("../../../../src/hooks/use-site-metadata")

describe("Footer component", () => {
  let fakeSiteMetadata

  beforeAll(() => {
    fakeSiteMetadata = {
      author: {
        name: `Iago`,
      },
      projectLicense: "salted-license",
    }
    useSiteMetadata.mockReturnValue(fakeSiteMetadata)
  })

  it("has copyright with terms & conditions", async () => {
    // Act
    render(<Footer />)
    // Assert
    const testId = "small-details-wrapper"
    const element = await screen.findByTestId(testId)

    const currentYear = new Date().getFullYear()
    // I don't know why the pseudo-class is not being applied. Something to understand later...
    expect(element.textContent).toBe(`© ${currentYear} ${fakeSiteMetadata.author.name}Terms & Conditions`)

    const linksElements = element.querySelectorAll(`a`)
    expect(linksElements.length).toBe(1)

    expect(element.querySelector("a")).toHaveAttribute("href", fakeSiteMetadata.projectLicense)

    expect(useSiteMetadata).toBeCalled()
  })
})
