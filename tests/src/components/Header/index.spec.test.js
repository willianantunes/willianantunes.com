import React from "react"
import Header from "../../../../src/components/Header"
import { render } from "../../../support/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { useSiteMetadata } from "../../../../src/hooks/use-site-metadata"

jest.mock("../../../../src/hooks/use-site-metadata")

describe("Header component", () => {
  let fakeSiteMetadata

  beforeAll(() => {
    fakeSiteMetadata = {
      project: `https://github.com/willianantunes/willianantunes.com`,
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

  it("has fork me ribbon", async () => {
    // Act
    render(<Header />)
    // Assert
    const testId = "fork-me-ribbon"
    const element = await screen.findByTestId(testId)
    expect(element.textContent).toBe("Fork me 🍴")
    expect(element.getAttribute("href")).toBe(fakeSiteMetadata.project)

    expect(useSiteMetadata).toBeCalled()
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

  it("has toggle theme", async () => {
    // Act
    const { container } = render(<Header />)
    // Assert
    const testId = "button-toggle-theme"
    const element = container.querySelector(`[data-testid="${testId}"]`)

    const titleWhenLight = "Change to light mode"
    const titleWhenDark = "Change to dark mode"

    const whenThemeIsLight = "theme-light"
    const whenThemeIsDark = "theme-dark"

    await waitFor(() => expect(document.querySelector(`.${whenThemeIsLight}`)).toBeInTheDocument())

    // https://github.com/testing-library/react-testing-library/issues/402
    // https://stackoverflow.com/questions/44073960/unit-testing-react-helmet-code
    expect(document.body.classList.contains(whenThemeIsLight)).toBeTruthy()
    expect(element.getAttribute("title")).toBe(titleWhenDark)
    expect(element.getAttribute("aria-pressed")).toBe("false")

    fireEvent.click(element)
    await screen.findByTitle(titleWhenLight)
    await waitFor(() => expect(document.querySelector(`.${whenThemeIsDark}`)).toBeInTheDocument())

    expect(document.body.classList.contains(whenThemeIsDark)).toBeTruthy()
    expect(element.getAttribute("title")).toBe(titleWhenLight)
    expect(element.getAttribute("aria-pressed")).toBe("true")
  })
})
