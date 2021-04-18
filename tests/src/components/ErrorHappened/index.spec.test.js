import React from "react"
import { render } from "../../../support/test-utils"
import { screen } from "@testing-library/react"
import ErrorHappened from "../../../../src/components/ErrorHappened"
import { Link } from "gatsby-theme-material-ui"

describe("ErrorHappened component", () => {
  it("has everything that was passed to given context of what has happened", async () => {
    // Arrange
    const motive = "Jafar attacked Agrabah"
    const description = "The Sultan's most trusted advisor, actually he's an evil sorcerer"
    // Act
    render(
      <ErrorHappened motive={motive} description={description}>
        But here’s something you can always find — <Link to="/">our home page</Link>!
      </ErrorHappened>
    )
    // Assert
    const testId = "error-wrapper"
    const element = await screen.findByTestId(testId)

    expect(element.children.length).toBe(3)
    const motiveElement = element.children[0]
    const descriptionElement = element.children[1]
    const workaroundElement = element.children[2]
    expect(motiveElement.textContent).toBe(motive)
    expect(descriptionElement.textContent).toBe(description)
    const expectedTextForWorkaround = `But here’s something you can always find — our home page!`
    expect(workaroundElement.textContent).toBe(expectedTextForWorkaround)
    expect(workaroundElement.querySelector("a")).toBeInTheDocument()
  })
})
