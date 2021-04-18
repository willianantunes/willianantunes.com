import React from "react"
import { render } from "../../../support/test-utils"
import { waitFor } from "@testing-library/react"
import { useSiteMetadata } from "../../../../src/hooks/use-site-metadata"
import { useStaticQuery } from "gatsby"
import { getMetaByName, getMetaByProperty } from "../../../support/html-utils"
import SEO from "../../../../src/components/SEO"

jest.mock("../../../../src/hooks/use-site-metadata")

describe("SEO component", () => {
  let fakeSiteMetadata
  let fakeStaticQueryResult

  beforeAll(() => {
    fakeSiteMetadata = {
      siteUrl: "http://localhost:8000",
      description: "Your honest description",
      title: "Main Title",
      social: { twitterLink: "https://twitter.com/willianantunes" },
    }
    fakeStaticQueryResult = { file: { publicURL: "/og-image.png" } }
    useStaticQuery.mockReturnValue(fakeStaticQueryResult)
    useSiteMetadata.mockReturnValue(fakeSiteMetadata)
  })

  it("has the basics when only title is configured", async () => {
    // Arrange
    const sampleTitle = "Sample Title"
    // Act
    render(<SEO title={sampleTitle} />)
    // Assert
    await waitFor(() => expect(document.querySelector("head title")).toBeInTheDocument())
    await waitFor(() => expect(document.querySelectorAll("head meta").length).toBeGreaterThanOrEqual(8))

    const finalTitle = `${sampleTitle} | ${fakeSiteMetadata.title}`
    expect(getMetaByName("description")).toBe(fakeSiteMetadata.description)
    expect(getMetaByProperty("og:image")).toBe("http://localhost:8000/og-image.png")
    expect(getMetaByProperty("og:type")).toBe("website")
    expect(getMetaByProperty("og:title")).toBe(finalTitle)
    expect(getMetaByProperty("og:description")).toBe(fakeSiteMetadata.description)
    expect(getMetaByName("twitter:card")).toBe("summary")
    expect(getMetaByName("twitter:site")).toBe(fakeSiteMetadata.social.twitterLink)
    expect(document.querySelector("title").text).toBe(finalTitle)
  })

  it("has a custom setup when all of its properties are provided", async () => {
    // Arrange
    const customTitle = "Custom Title"
    const customDescription = "Hello my friend, stay awhile and listen!"
    const customImage = "https://willianantunes.com.br/assets/img/iago.png"
    const customMetas = [
      {
        name: `aladdi:jafar`,
        content: `iago`,
      },
    ]
    // Act
    render(<SEO description={customDescription} meta={customMetas} title={customTitle} image={customImage} />)
    // Assert
    await waitFor(() => expect(document.querySelector("head title")).toBeInTheDocument())
    await waitFor(() => expect(document.querySelectorAll("head meta").length).toBeGreaterThanOrEqual(8))

    const finalTitle = `${customTitle} | ${fakeSiteMetadata.title}`
    expect(getMetaByName("description")).toBe(customDescription)
    expect(getMetaByProperty("og:image")).toBe(customImage)
    expect(getMetaByProperty("og:type")).toBe("website")
    expect(getMetaByProperty("og:title")).toBe(finalTitle)
    expect(getMetaByProperty("og:description")).toBe(customDescription)
    expect(getMetaByName("twitter:card")).toBe("summary")
    expect(getMetaByName("twitter:site")).toBe(fakeSiteMetadata.social.twitterLink)
    expect(getMetaByName(customMetas[0].name)).toBe(customMetas[0].content)
    expect(document.querySelector("title").text).toBe(finalTitle)
  })
})
