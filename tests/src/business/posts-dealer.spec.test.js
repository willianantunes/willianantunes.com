import { groupByYear, groupLevels } from "../../../src/business/posts-dealer"

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

  it("should group levels of a given heading", () => {
    // Arrange
    const headings = [
      {
        id: "joey-stop-hitting-on-her",
        value: "Joey, stop hitting on her! It's her wedding day!",
        depth: 2,
      },
      {
        id: "please-dont-do-that-again",
        value: "Please don't do that again, it's a horrible sound.",
        depth: 3,
      },
      {
        id: "oh-god-is-it",
        value: "Oh God, is it 6:30?",
        depth: 4,
      },
      {
        id: "buzz-him-in",
        value: "Buzz him in!",
        depth: 5,
      },
      {
        id: "whos-paul",
        value: "Who's Paul?",
        depth: 4,
      },
      {
        id: "so-rachel-whatre-you",
        value: "So Rachel, what're you, uh... what're you up to tonight?",
        depth: 3,
      },
      {
        id: "hey-pheebs-you-wanna-help",
        value: "Hey Pheebs, you wanna help",
        depth: 2,
      },
      {
        id: "oh-i-wish-i-could-but-i-dont-want-to",
        value: "Oh, I wish I could, but I don't want to.",
        depth: 3,
      },
      {
        id: "i-have-no-idea",
        value: "I have no idea.",
        depth: 2,
      },
    ]
    // Act
    const result = groupLevels(headings)
    // Assert
    expect(result).toStrictEqual([
      {
        id: "joey-stop-hitting-on-her",
        value: "Joey, stop hitting on her! It's her wedding day!",
        depth: 2,
        headings: [
          {
            id: "please-dont-do-that-again",
            value: "Please don't do that again, it's a horrible sound.",
            depth: 3,
            headings: [
              {
                id: "oh-god-is-it",
                value: "Oh God, is it 6:30?",
                depth: 4,
                headings: [
                  {
                    id: "buzz-him-in",
                    value: "Buzz him in!",
                    depth: 5,
                  },
                ],
              },
              {
                id: "whos-paul",
                value: "Who's Paul?",
                depth: 4,
              },
            ],
          },
          {
            id: "so-rachel-whatre-you",
            value: "So Rachel, what're you, uh... what're you up to tonight?",
            depth: 3,
          },
        ],
      },
      {
        id: "hey-pheebs-you-wanna-help",
        value: "Hey Pheebs, you wanna help",
        depth: 2,
        headings: [
          {
            id: "oh-i-wish-i-could-but-i-dont-want-to",
            value: "Oh, I wish I could, but I don't want to.",
            depth: 3,
          },
        ],
      },
      {
        id: "i-have-no-idea",
        value: "I have no idea.",
        depth: 2,
      },
    ])
  })
})
