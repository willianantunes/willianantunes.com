import React from "react"
import { render } from "../../../support/test-utils"
import { screen } from "@testing-library/react"
import ContributionDetails from "../../../../src/components/ContributionDetails"
import { TARGET_REPO_BRANCH_CONTRIBUTION } from "../../../../src/config/settings.js"

describe("ContributionDetails component", () => {
  it("is rendered properly", async () => {
    // Arrange
    const samplePath = "/xpto/content/blog/2021/05/2021-05-21-gke-ingress-how-to-configure-ipv4-and-ipv6-addresses.md"
    // Act
    render(<ContributionDetails pathWhereEntryIsSaved={samplePath} />)
    // Assert
    const testId = "contribution-pr-blog-entry-link"
    const element = await screen.findByTestId(testId)
    const renderedLink = element.getAttribute("href")
    const expectedLink = `${TARGET_REPO_BRANCH_CONTRIBUTION}/blog/2021/05/2021-05-21-gke-ingress-how-to-configure-ipv4-and-ipv6-addresses.md`
    expect(renderedLink).toBe(expectedLink)
  })
})
