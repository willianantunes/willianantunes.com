import React from "react"
import { render } from "../../../support/test-utils"
import { screen } from "@testing-library/react"
import { useSiteMetadata } from "../../../../src/hooks/use-site-metadata"
import ListOfGalleryEntries from "../../../../src/components/ListOfGalleryEntries"

jest.mock("../../../../src/hooks/use-site-metadata")

describe("ListOfGalleryEntries component", () => {
  let fakeSiteMetadata

  beforeAll(() => {
    fakeSiteMetadata = {
      siteUrl: "http://localhost:8000",
    }
    useSiteMetadata.mockReturnValue(fakeSiteMetadata)
  })

  it("is rendered properly", async () => {
    // Arrange
    const sampleEntries = [
      {
        date: "2021-04-27T13:21:42.402Z",
        title: "A place where you can learn Phonetics",
        projectLink: "https://www.raveofphonetics.com/",
        description:
          "I realized that there were many phonetic transcription sites, but they did not have even the most basic features. That's how it was conceived! The front-end uses Gatsby and the back-end Django.",
        cover: { publicURL: "/static/328b177bb41731dc35e0b2dcec044da1/labs-rop.png" },
      },
      {
        date: "2021-04-27T11:21:51.491Z",
        title: "My own blog",
        projectLink: "https://github.com/willianantunes/willianantunes.com",
        description:
          "It was built from the ground up using Gatsby. It uses Netlify CMS, Jest, React Testing Library, SonarCloud, styled-components, and many more!",
        cover: { publicURL: "/static/ad10858454d89e8179c7eb9529387889/labs-my-own-blog.png" },
      },
    ]
    // Act
    render(<ListOfGalleryEntries entries={sampleEntries} />)
    // Assert
    const testId = "gallery-entries-wrapper"
    const element = await screen.findByTestId(testId)
    const linksElements = element.querySelectorAll(`a`)
    expect(linksElements.length).toBe(sampleEntries.length)
    expect(useSiteMetadata).toBeCalled()
  })
})
