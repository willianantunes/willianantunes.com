import React from "react"
import { render } from "../../../support/test-utils"
import { waitFor } from "@testing-library/react"
import BlogPost from "../../../../src/components/BlogPost"

describe("BlogPost component", () => {
  it("is rendered properly", async () => {
    // Arrange
    const fakeSiteUrl = "http://localhost:8000"
    const samplePost = {
      markdownRemark: {
        id: "45b53d2f-c2cf-5f93-babf-59c40e92336b",
        excerpt:
          "If I had to recommend to someone, assuming important requirements like time to market, a huge ecosystem, many tutorials, no expected advanced knowledge in…",
        html: "<p>Lorem ipsum!</p>\n<h2>Honest title</h2>\n<p>Let's dive a bit into some more honest things</p>",
        timeToRead: 1,
        frontmatter: {
          title: "Why did I create a blog from scratch?",
          formattedDate: "April 19, 2021",
          date: "2021-04-19T12:07:02.971Z",
          description:
            "Reinventing the wheel, depending on the context, can be brilliant! Curiosity can lead us into new enchanting things.",
          tags: ["advice", "open-source", "comfort zone"],
          id: "c05522a0-a107-11eb-ac99-e3c3577a000f",
          cover: {
            id: "893a53fd-eda7-52f2-916d-ede03f04aba2",
            publicURL: "/static/3fcc1ae287204ee971fbdd641eef6809/blog-1-opengraph.png",
          },
        },
      },
      previous: null,
      next: null,
    }
    const { markdownRemark: currentPost } = samplePost
    const date = currentPost.frontmatter.date
    const formattedDate = currentPost.frontmatter.formattedDate
    const title = currentPost.frontmatter.title
    const tags = currentPost.frontmatter.tags
    const content = currentPost.html
    const timeToRead = currentPost.timeToRead
    const image = `${fakeSiteUrl}${currentPost.frontmatter.cover.publicURL}`
    // Act
    render(
      <BlogPost
        title={title}
        date={date}
        formattedDate={formattedDate}
        content={content}
        timeToRead={timeToRead}
        tags={tags}
        image={image}
      />
    )
    // Assert
    const testId = "blog-post-article-wrapper"
    await waitFor(() => expect(document.querySelector(`[data-testid="${testId}"]`)).toBeInTheDocument())
  })
})
