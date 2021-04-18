import { groupByYear } from "../../../src/business/posts-dealer"

function buildSamplePostWithMinimalAttrs(date, title) {
  return {
    frontmatter: {
      date,
      title,
    },
  }
}

describe("Posts dealer", () => {
  it("should group a list of posts by year", () => {
    // Arrange
    const post_0 = buildSamplePostWithMinimalAttrs("2021-03-19T12:07:02.971Z", "Well, it matters to me!")
    const post_1 = buildSamplePostWithMinimalAttrs("2021-04-19T12:07:02.971Z", "I just feel like someone")
    const post_2 = buildSamplePostWithMinimalAttrs("2021-05-19T12:07:02.971Z", "Carol moved her stuff out today")
    const post_3 = buildSamplePostWithMinimalAttrs("2022-04-19T12:07:02.971Z", "So you wanna tell us now, or are we waiting")
    const post_4 = buildSamplePostWithMinimalAttrs("2023-04-19T12:07:02.971Z", "Who wasn't invited to the wedding.")
    const posts = [post_0, post_1, post_2, post_3, post_4]
    const copyOfPosts = posts.map(post => Object.assign({}, post))
    // Act
    const result = groupByYear(copyOfPosts)
    // Assert
    expect(result).toStrictEqual([
      { year: "2023", posts: [post_4] },
      { year: "2022", posts: [post_3] },
      { year: "2021", posts: [post_2, post_1, post_0] },
    ])
  })
})
