require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

// Now that ENV was loaded, we can check out the constants and plugins setup
const { SITE_URL, GatsbyPluginFeed } = require("./src/config/settings")

const myName = "Willian Antunes"
const siteMetadata = {
  name: myName,
  shortName: `WA`,
  title: `An honest place where you can learn things about programming`,
  author: {
    name: myName,
  },
  description: `Where I blog about technology, my personal life, tools that I've built as well as playgrounds, and many more.`,
  siteUrl: SITE_URL,
  project: `https://github.com/willianantunes/willianantunes.com`,
  projectLicense: `https://github.com/willianantunes/willianantunes.com/blob/main/LICENSE`,
  social: {
    twitter: `https://twitter.com/willianantunes`,
    instagram: `https://www.instagram.com/willian.lima.antunes`,
    github: `https://github.com/willianantunes`,
    linkedin: `https://www.linkedin.com/in/willianantunes`,
    youtube: `https://www.youtube.com/channel/UCSbLr4rO7qvyZFaRt1LvErQ`,
    dockerhub: `https://hub.docker.com/u/willianantunes`,
    stackoverflow: `https://stackoverflow.com/users/3899136/willian-antunes`,
    hackerrank: `https://www.hackerrank.com/willianantunes`,
    strava: `https://www.strava.com/athletes/willian-antunes`,
    leetcode: `https://leetcode.com/willianantunes/`,
  },
}

const plugins = [
  {
    resolve: "gatsby-source-filesystem",
    options: {
      path: `${__dirname}/static/assets`,
      name: "uploads",
    },
  },
  {
    resolve: `gatsby-source-filesystem`,
    options: {
      path: `${__dirname}/content/blog`,
      name: `blog`,
    },
  },
  {
    resolve: `gatsby-source-filesystem`,
    options: {
      path: `${__dirname}/content/pages`,
      name: `pages`,
    },
  },
  `gatsby-plugin-sharp`,
  `gatsby-transformer-sharp`,
  {
    resolve: `gatsby-transformer-remark`,
    options: {
      plugins: [
        `gatsby-remark-embed-video`,
        `gatsby-remark-responsive-iframe`,
        `gatsby-remark-images`,
        `gatsby-remark-autolink-headers`,
        `gatsby-remark-prismjs`,
        `gatsby-remark-external-links`,
      ],
    },
  },
  `gatsby-plugin-react-helmet`,
  `gatsby-theme-material-ui`,
  `gatsby-plugin-styled-components`,
  {
    resolve: `gatsby-plugin-netlify-cms`,
    options: {
      modulePath: `${__dirname}/src/cms/cms.js`,
      publicPath: "genie",
      manualInit: true,
    },
  },
  `gatsby-plugin-sitemap`,
  {
    resolve: `gatsby-plugin-feed`,
    options: GatsbyPluginFeed.applyOptions(siteMetadata.name),
  },
  `gatsby-plugin-netlify`,
]

module.exports = {
  siteMetadata,
  plugins,
}
