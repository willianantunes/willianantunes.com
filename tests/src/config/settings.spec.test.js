import { EnvironmentError } from "../../../src/config/exceps"

const configureMustHaveEnv = () => {
  process.env.SITE_URL = "https://www.spacejam.com/1996/"
  process.env.GOOGLE_TAG_MANAGER_ID = "XPTO"
  process.env.NETLIFY_CMS_BACKEND_REPO = "agrabah/jasmine"
  process.env.NETLIFY_CMS_BACKEND_BRANCH = "main"
  process.env.DISQUS_SHORTNAME = "agrabah"
}

describe("Settings module", () => {
  // This marked as skipped because it breaks all the time given race conditions
  xdescribe("Constant ENV", () => {
    beforeEach(() => {
      delete process.env.SITE_URL
    })

    it("should throw exception if must have constant wasn't set", () => {
      // Arrange
      const shouldThrowError = () => {
        require("../../../src/config/settings")
      }
      const expectedErrorMessage = `Environment variable SITE_URL is not set!`
      // Act and assert
      expect(shouldThrowError).toThrow(new EnvironmentError(expectedErrorMessage))
    })

    it("should evaluate constant as false", () => {
      // Arrange
      process.env.SITE_URL = "https://www.spacejam.com/1996/"
      process.env.GOOGLE_TAG_MANAGER_ID = "XPTO"
      process.env.GTM_INCLUDE_DEVELOPMENT = "f"
      const evaluateConstant = () => {
        const { GTM_INCLUDE_DEVELOPMENT } = require("../../../src/config/settings")
        return GTM_INCLUDE_DEVELOPMENT
      }
      // Act
      const constant = evaluateConstant()
      // Assert
      expect(typeof constant).toBe("boolean")
      expect(constant).toBe(false)
    })

    it("should evaluate constant as true", () => {
      // Arrange
      process.env.SITE_URL = "https://www.raveofphonetics.com/"
      process.env.GOOGLE_TAG_MANAGER_ID = "QWERTY"
      process.env.GTM_INCLUDE_DEVELOPMENT = "t"
      const evaluateConstant = () => {
        const { GTM_INCLUDE_DEVELOPMENT } = require("../../../src/config/settings")
        return GTM_INCLUDE_DEVELOPMENT
      }
      // Act
      const constant = evaluateConstant()
      // Assert
      expect(typeof constant).toBe("boolean")
      expect(constant).toBe(true)
    })
  })

  describe("Gatsby Plugin Feed setup", () => {
    beforeAll(() => {
      configureMustHaveEnv()
    })

    it("should return list of feeds properly configured", () => {
      // Arrange
      const sampleResult = {
        query: {
          site: {
            siteMetadata: {
              title: "An honest place where you can learn things about programming",
              description:
                "Where I blog about technology, my personal life, tools that I've built as well as playgrounds, and many more.",
              siteUrl: "http://localhost:8000",
            },
          },
          allMarkdownRemark: {
            edges: [
              {
                node: {
                  id: "45b53d2f-c2cf-5f93-babf-59c40e92336b",
                  fields: {
                    path: "/blog/2021/04/why-did-i-create-a-blog-from-scratch/",
                  },
                  frontmatter: {
                    title: "Why did I create a blog from scratch?",
                    description:
                      "Reinventing the wheel, depending on the context, can be brilliant! Curiosity can lead us into new enchanting things.",
                    date: "2021-04-19T12:07:02.971Z",
                  },
                  excerpt:
                    "<p>If I had to recommend to someone, assuming important requirements like time to market, a huge ecosystem, many tutorials, no expected advanced knowledge in programming at all, I would tell this person to start right away with Blogger, but if more options are needed, then Wordpress. Now, if the idea is to know how stuff works, and utilize a technology that handles not only on the front-end but on the back-end also, thinking carefully in terms of its usage on the job market, I'd advise using a tec…</p>",
                },
              },
            ],
          },
        },
      }
      const { GatsbyPluginFeed } = require("../../../src/config/settings")
      // Act
      const feed = GatsbyPluginFeed.getFeedSetup()
      const { serialize, query } = feed
      const serializeResult = serialize(sampleResult)
      // Assert
      expect(Object.keys(feed).length).toBe(2)
      expect(query).toBe(`
      {
        allMarkdownRemark(sort: {order: DESC, fields: [frontmatter___date]}) {
          edges {
            node {
              id
              fields {
                path
              }
              frontmatter {
                title
                description
                date
              }
              excerpt(truncate: true, pruneLength: 500, format: HTML)
            }
          }
        }
      }
    `)
      expect(serializeResult.length).toBe(1)
      expect(serializeResult[0]).toStrictEqual({
        title: "Why did I create a blog from scratch?",
        description:
          "Reinventing the wheel, depending on the context, can be brilliant! Curiosity can lead us into new enchanting things.",
        date: "2021-04-19T12:07:02.971Z",
        url: "http://localhost:8000/blog/2021/04/why-did-i-create-a-blog-from-scratch/",
        guid: "45b53d2f-c2cf-5f93-babf-59c40e92336b",
        custom_elements: [
          {
            "content:encoded":
              "<p>If I had to recommend to someone, assuming important requirements like time to market, a huge ecosystem, many tutorials, no expected advanced knowledge in programming at all, I would tell this person to start right away with Blogger, but if more options are needed, then Wordpress. Now, if the idea is to know how stuff works, and utilize a technology that handles not only on the front-end but on the back-end also, thinking carefully in terms of its usage on the job market, I'd advise using a tec…</p>",
          },
        ],
      })
    })

    it("should create options", () => {
      // Arrange
      const { GatsbyPluginFeed } = require("../../../src/config/settings")
      const sampleSiteName = "Jasmine"
      // Act
      const options = GatsbyPluginFeed.applyOptions(sampleSiteName)
      const { serialize, query, output, title } = options.feeds[0]
      // Assert
      expect(options.feeds.length).toBe(1)
      expect(output).toBe("/rss.xml")
      expect(title).toBe(`${sampleSiteName}'s RSS Feed`)
      expect(query).toBeDefined()
      expect(serialize).toBeInstanceOf(Function)
    })
  })
})
