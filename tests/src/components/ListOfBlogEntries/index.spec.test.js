import React from "react"
import { render } from "../../../support/test-utils"
import { screen } from "@testing-library/react"
import ListOfBlogEntries from "../../../../src/components/ListOfBlogEntries"

jest.mock("../../../../src/hooks/use-site-metadata")

describe("ListOfBlogEntries component", () => {
  it("is rendered properly", async () => {
    // Arrange
    const sampleYear = "2021"
    const samplePosts = [
      {
        excerpt: "Sample excerpt 1",
        fields: {
          slug: "2021-01-01-why-jafar",
          path: "/blog/2021/01/why-jafar/",
        },
        frontmatter: {
          id: "5e39d4a4-aa26-44b7-9203-82c320b786ae",
          date: "2021-01-01T12:07:02.971Z",
          formattedDate: "January 01, 2021",
          title: "Why does Jafar pursue for power?",
          description: "Sample description",
          tags: ["aladdin", "power"],
        },
      },
      {
        excerpt: "Sample excerpt 2",
        fields: {
          slug: "2021-02-01-sample-2",
          path: "/blog/2021/02/why-jafar/",
        },
        frontmatter: {
          id: "dc3f1dcb-456a-4ee2-8104-5e846c4cd289",
          date: "2021-02-01T12:07:02.971Z",
          formattedDate: "February 01, 2021",
          title: "Why sample 2?",
          description: "Sample description 2",
          tags: ["sample", "2"],
        },
      },
    ]
    // Act
    render(<ListOfBlogEntries year={sampleYear} posts={samplePosts} />)
    // Assert
    const testId = "posts-entries-wrapper"
    const element = await screen.findByTestId(testId)
    const linksElements = element.querySelectorAll(`a`)
    expect(linksElements.length).toBe(samplePosts.length)
  })
})
