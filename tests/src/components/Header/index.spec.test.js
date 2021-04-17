import React from "react"
import Header from "../../../../src/components/Header"
import { render } from "../../../support/test-utils"
import { screen } from "@testing-library/react"
import { useSiteMetadata } from "../../../../src/hooks/use-site-metadata"

jest.mock("../../../../src/hooks/use-site-metadata")

describe("Header component", () => {
  let fakeSiteMetadata

  beforeAll(() => {
    fakeSiteMetadata = {
      author: {
        name: `Willian Antunes`,
      },
      social: {
        twitter: `https://twitter.com/willianantunes`,
        instagram: `https://www.instagram.com/willian.lima.antunes`,
        github: `https://github.com/willianantunes`,
        linkedin: `https://www.linkedin.com/in/willianantunes`,
        youtube: `https://www.youtube.com/channel/UCSbLr4rO7qvyZFaRt1LvErQ`,
        dockerhub: `https://hub.docker.com/u/willianantunes`,
        stackoverflow: `https://stackoverflow.com/users/3899136/willian-antunes`,
      },
    }
    useSiteMetadata.mockReturnValue(fakeSiteMetadata)
  })

  it("has links to social medias", async () => {
    // Act
    render(<Header />)
    // Assert
    const testId = "social-links-wrapper"
    const element = await screen.findByTestId(testId)

    const socialLinks = Object.values(fakeSiteMetadata.social)
    const linksElements = element.querySelectorAll(`a`)
    expect(linksElements.length).toBe(socialLinks.length)

    for (const socialLink of socialLinks) {
      const htmlElement = element.querySelector(`a[href='${socialLink}']`)
      expect(htmlElement).toBeInTheDocument()
    }

    expect(useSiteMetadata).toBeCalled()
  })

  it("has links to pages", async () => {
    // Act
    render(<Header />)
    // Assert
    const testId = "site-links-wrapper"
    const element = await screen.findByTestId(testId)

    const expectedPages = ["/", "/about", "/labs"]
    const linksElements = element.querySelectorAll(`a`)
    expect(linksElements.length).toBe(expectedPages.length)

    for (const pageLink of expectedPages) {
      const htmlElement = element.querySelector(`a[href='${pageLink}']`)
      expect(htmlElement).toBeInTheDocument()
    }

    expect(useSiteMetadata).toBeCalled()
  })
})
