import { BlogNodeHandler, PageNodeHandler } from "../../../src/config/gatsby-node-handlers"
import { createFilePath } from "gatsby-source-filesystem"

jest.mock("gatsby-source-filesystem")

describe("Gatsby Node Handler module", () => {
  describe("BlogNodeHandler", () => {
    it("when called to handle pages, should call createPageCallable properly", async () => {
      // Arrange
      const graphqlCallable = jest.fn()
      const firstFakeResultFromGraphqlConsult = {
        data: {
          allMarkdownRemark: {
            totalCount: 1,
          },
        },
      }
      const secondFakeResultFromGraphqlConsult = {
        data: {
          allMarkdownRemark: {
            nodes: [
              {
                id: "45b53d2f-c2cf-5f93-babf-59c40e92336b",
                fields: {
                  slug: "2021-04-19-why-did-i-create-a-blog-from-scratch",
                  path: "/blog/2021/04/why-did-i-create-a-blog-from-scratch/",
                },
              },
            ],
          },
        },
      }
      graphqlCallable
        .mockReturnValueOnce(firstFakeResultFromGraphqlConsult)
        .mockReturnValueOnce(secondFakeResultFromGraphqlConsult)
      const createPageCallable = jest.fn()
      // Act
      await BlogNodeHandler.createPagesHandler(graphqlCallable, createPageCallable)
      // Assert
      expect(graphqlCallable.mock.calls.length).toBe(2)
      expect(createPageCallable.mock.calls.length).toBe(1)
      const firstCall = createPageCallable.mock.calls[0]
      const argumentsLength = firstCall.length
      expect(argumentsLength).toBe(1)
      const whatWasSentAsTheArgument = firstCall[0]
      const expectedArgument = expect.objectContaining({
        component: expect.any(String),
        context: {
          id: "45b53d2f-c2cf-5f93-babf-59c40e92336b",
          nextPostId: null,
          previousPostId: null,
        },
        path: "/blog/2021/04/why-did-i-create-a-blog-from-scratch/",
      })
      expect(whatWasSentAsTheArgument).toEqual(expectedArgument)
      whatWasSentAsTheArgument.component.endsWith(`/src/templates/blog-post.js`)
    })

    it("when called to create node, should call createNodeFieldCallable twice", () => {
      // Arrange
      const createNodeFieldCallable = jest.fn()
      const getNodeCallable = jest.fn()
      const fakeReturnValue = "/2021/04/2021-04-19-why-did-i-create-a-blog-from-scratch/"
      createFilePath.mockReturnValueOnce(fakeReturnValue)
      const fakeNode = {
        id: "45b53d2f-c2cf-5f93-babf-59c40e92336b",
        children: [],
        parent: "921faf04-74f4-5311-bc99-e8768891663d",
        internal: {
          content:
            "If I had to recommend to someone, assuming important requirements like time to market, a huge ecosystem, many tutorials, no expected advanced knowledge in programming at all, I would tell this person to start right away with Blogger, but if more options are needed, then Wordpress. Now, if the idea is to know how stuff works, and utilize a technology that handles not only on the front-end but on the back-end also, thinking carefully in terms of its usage on the job market, I'd advise using a technology built on top of JavaScript.\n\n## Why JavaScript and not PHP or another language\n\nLet's dive a bit into some more concerns. What I usually do is look over data. To illustrate, what I've been doing to answer such questions so far is the following:\n\n1. [Search for projects through hashtags on GitHub](https://github.com/topics/wordpress?l=php).\n2. Look at the latest survey called [The State of Developer Ecosystem made by JetBrains](https://www.jetbrains.com/lp/devecosystem-2020/).\n3. Look at the latest [developer survey made by StackOverflow](https://insights.stackoverflow.com/survey/2020).\n4. [Which tags are most answered on StackOverflow](https://stackoverflow.com/tags).\n5. Jobs offered out there. LinkedIn is a good place to look over.\n6. Things related to how expensive the technology is to deploy and serve its purpose.\n7. Documentation.\n8. Asking skilled friends out there 😅.\n\nThere is no silver bullet, and some people might prefer a language that they already know, so this can be quite complex. Some may prefer a technology built from Java, Ruby, and many others. But the thing is, what technologies have companies been using so far? I would look carefully at them to start with.\n\nMy research pointed out JavaScript either using Gatsby or Next.JS as the framework. Nowadays I'm more used to Python though, so what should I do? I mean, getting out of our comfort zone is quite challenging, but it's necessary.\n\n## Knowing new technologies opens your mind\n\nWhen people discuss this topic, I like to compare it to learning a new language. In the beginning, it can be dull, monotonous, boring, but the game starts to change when you see your evolution, and people start to tell you about it. It's satisfying! When you notice, you will have a new tool to use to communicate with people and even apply it in your job. The same refers to technology. We must strive for new things and understand the other side.\n\n## When you study technologies through playgrounds, leave them open-source\n\nIsn't it amazing when you need to create/build something and you find a playground project out there that you can base your work from? Apart from that, when you create an open-source project, that can be used as your portfolio too. So use it wisely! Sell yourself!\n\n## Final words and honest advice\n\nJust a little piece of advice here in this very first article. One thing is discovering new tools and using them on your personal projects, and another entirely different thing is applying them to your job. Know the consequences. There are many variables to look after. Let's assume you will exchange the services to use [Hanami](https://www.ruby-toolbox.com/projects/hanami) instead of [Rails](https://www.ruby-toolbox.com/projects/rails), you are supposed to answer at least the following questions:\n\n* Will it bring business value?\n* Will the customers be positively impacted by it?\n* Does it have support from the community?\n* Does it have support from companies out there?\n* Is it hard to find people that can work with it?\n* Is it arduous to teach people that have never been in contact with the language or the framework?\n\nThere are others of course, but the point has been made 😁.\n\nThis is the first blog entry and I expect to post once per month at least. I hope I can keep with this goal! 😄",
          type: "MarkdownRemark",
          contentDigest: "7067e9dcb0e8f993d59c57195d4fa198",
          owner: "gatsby-transformer-remark",
          counter: 65,
        },
        frontmatter: {
          title: "Why did I create a blog from scratch?",
          id: "c05522a0-a107-11eb-ac99-e3c3577a000f",
          date: "2021-04-19T12:07:02.971Z",
          cover: "../../../../static/assets/posts/blog-1-opengraph.png",
          description:
            "Reinventing the wheel, depending on the context, can be brilliant! Curiosity can lead us into new enchanting things.",
          tags: ["advice", "open-source", "comfort zone"],
        },
        excerpt: "",
        rawMarkdownBody:
          "If I had to recommend to someone, assuming important requirements like time to market, a huge ecosystem, many tutorials, no expected advanced knowledge in programming at all, I would tell this person to start right away with Blogger, but if more options are needed, then Wordpress. Now, if the idea is to know how stuff works, and utilize a technology that handles not only on the front-end but on the back-end also, thinking carefully in terms of its usage on the job market, I'd advise using a technology built on top of JavaScript.\n\n## Why JavaScript and not PHP or another language\n\nLet's dive a bit into some more concerns. What I usually do is look over data. To illustrate, what I've been doing to answer such questions so far is the following:\n\n1. [Search for projects through hashtags on GitHub](https://github.com/topics/wordpress?l=php).\n2. Look at the latest survey called [The State of Developer Ecosystem made by JetBrains](https://www.jetbrains.com/lp/devecosystem-2020/).\n3. Look at the latest [developer survey made by StackOverflow](https://insights.stackoverflow.com/survey/2020).\n4. [Which tags are most answered on StackOverflow](https://stackoverflow.com/tags).\n5. Jobs offered out there. LinkedIn is a good place to look over.\n6. Things related to how expensive the technology is to deploy and serve its purpose.\n7. Documentation.\n8. Asking skilled friends out there 😅.\n\nThere is no silver bullet, and some people might prefer a language that they already know, so this can be quite complex. Some may prefer a technology built from Java, Ruby, and many others. But the thing is, what technologies have companies been using so far? I would look carefully at them to start with.\n\nMy research pointed out JavaScript either using Gatsby or Next.JS as the framework. Nowadays I'm more used to Python though, so what should I do? I mean, getting out of our comfort zone is quite challenging, but it's necessary.\n\n## Knowing new technologies opens your mind\n\nWhen people discuss this topic, I like to compare it to learning a new language. In the beginning, it can be dull, monotonous, boring, but the game starts to change when you see your evolution, and people start to tell you about it. It's satisfying! When you notice, you will have a new tool to use to communicate with people and even apply it in your job. The same refers to technology. We must strive for new things and understand the other side.\n\n## When you study technologies through playgrounds, leave them open-source\n\nIsn't it amazing when you need to create/build something and you find a playground project out there that you can base your work from? Apart from that, when you create an open-source project, that can be used as your portfolio too. So use it wisely! Sell yourself!\n\n## Final words and honest advice\n\nJust a little piece of advice here in this very first article. One thing is discovering new tools and using them on your personal projects, and another entirely different thing is applying them to your job. Know the consequences. There are many variables to look after. Let's assume you will exchange the services to use [Hanami](https://www.ruby-toolbox.com/projects/hanami) instead of [Rails](https://www.ruby-toolbox.com/projects/rails), you are supposed to answer at least the following questions:\n\n* Will it bring business value?\n* Will the customers be positively impacted by it?\n* Does it have support from the community?\n* Does it have support from companies out there?\n* Is it hard to find people that can work with it?\n* Is it arduous to teach people that have never been in contact with the language or the framework?\n\nThere are others of course, but the point has been made 😁.\n\nThis is the first blog entry and I expect to post once per month at least. I hope I can keep with this goal! 😄",
        fileAbsolutePath:
          "/home/antunes/Development/git-personal/willianantunes.com/content/blog/2021/04/2021-04-19-why-did-i-create-a-blog-from-scratch.md",
      }
      // Act
      BlogNodeHandler.createNodeHandler(createNodeFieldCallable, getNodeCallable, fakeNode)
      // Assert
      // First mocked object
      expect(createFilePath.mock.calls.length).toBe(1)
      const createFilePathFirstCall = createFilePath.mock.calls[0]
      const createFilePathFirstCallArgumentsLength = createFilePathFirstCall.length
      expect(createFilePathFirstCallArgumentsLength).toBe(1)
      const whatWasSentAsTheArgumentToCreateFilePathFirstCall = createFilePathFirstCall[0]
      expect(whatWasSentAsTheArgumentToCreateFilePathFirstCall).toStrictEqual({ node: fakeNode, getNode: getNodeCallable })
      // Second mocked object
      expect(createNodeFieldCallable.mock.calls.length).toBe(2)
      const createNodeFieldCallableFirstCall = createNodeFieldCallable.mock.calls[0]
      const createNodeFieldCallableSecondCall = createNodeFieldCallable.mock.calls[1]
      expect(createNodeFieldCallableFirstCall.length).toBe(1)
      expect(createNodeFieldCallableSecondCall.length).toBe(1)
      const whatWasSentAsTheArgumentToCreateNodeFieldCallableFirstCall = createNodeFieldCallableFirstCall[0]
      const whatWasSentAsTheArgumentToCreateNodeFieldCallableSecondCall = createNodeFieldCallableSecondCall[0]
      expect(whatWasSentAsTheArgumentToCreateNodeFieldCallableFirstCall).toStrictEqual({
        name: "slug",
        node: fakeNode,
        value: "2021-04-19-why-did-i-create-a-blog-from-scratch",
      })
      expect(whatWasSentAsTheArgumentToCreateNodeFieldCallableSecondCall).toStrictEqual({
        name: "path",
        node: fakeNode,
        value: "/blog/2021/04/why-did-i-create-a-blog-from-scratch/",
      })
      // Third mocked object
      expect(getNodeCallable.mock.calls.length).toBe(0)
    })
  })

  describe("PageNodeHandler", () => {
    it("when called to handle pages, should call createPageCallable properly", async () => {
      // Arrange
      const graphqlCallable = jest.fn()
      const fakeResultFromGraphqlConsult = {
        data: {
          allMarkdownRemark: {
            nodes: [
              {
                id: "b46b26a4-03e5-553a-a4cc-dfd444fc436e",
                frontmatter: {
                  path: "/about",
                  templateFileName: "about-page",
                },
              },
            ],
          },
        },
      }
      const fakeNode = fakeResultFromGraphqlConsult.data.allMarkdownRemark.nodes[0]
      graphqlCallable.mockReturnValueOnce(fakeResultFromGraphqlConsult)
      const createPageCallable = jest.fn()
      // Act
      await PageNodeHandler.createPagesHandler(graphqlCallable, createPageCallable)
      // Assert
      expect(graphqlCallable.mock.calls.length).toBe(1)
      expect(createPageCallable.mock.calls.length).toBe(1)
      const firstCall = createPageCallable.mock.calls[0]
      const argumentsLength = firstCall.length
      expect(argumentsLength).toBe(1)
      const whatWasSentAsTheArgument = firstCall[0]
      const expectedArgument = expect.objectContaining({
        path: fakeNode.frontmatter.path,
        component: expect.any(String),
        context: {
          id: fakeNode.id,
        },
      })
      expect(whatWasSentAsTheArgument).toEqual(expectedArgument)
      whatWasSentAsTheArgument.component.endsWith(`/src/templates/${fakeNode.frontmatter.templateFileName}.js`)
    })
  })
})
