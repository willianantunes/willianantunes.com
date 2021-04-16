require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

// Now that ENV was loaded, we can check out the constants
const { GOOGLE_TAG_MANAGER_ID, GTM_INCLUDE_DEVELOPMENT, SITE_URL } = require("./src/config/settings")

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
  social: {
    twitter: `https://twitter.com/willianantunes`,
    instagram: `https://www.instagram.com/willian.lima.antunes`,
    github: `https://github.com/willianantunes`,
    linkedin: `https://www.linkedin.com/in/willianantunes`,
    youtube: `https://www.youtube.com/channel/UCSbLr4rO7qvyZFaRt1LvErQ`,
    dockerhub: `https://hub.docker.com/u/willianantunes`,
    stackoverflow: `https://stackoverflow.com/users/3899136/willian-antunes`,
  },
}

const plugins = [
  `gatsby-plugin-sharp`,
  `gatsby-transformer-sharp`,
  {
    resolve: "gatsby-source-filesystem",
    options: {
      path: `${__dirname}/static/assets`,
      name: "uploads",
    },
  },
  {
    resolve: "gatsby-plugin-google-tagmanager",
    options: {
      id: GOOGLE_TAG_MANAGER_ID,
      // Include GTM in development.
      // Defaults to false meaning GTM will only be loaded in production.
      includeInDevelopment: GTM_INCLUDE_DEVELOPMENT,
    },
  },
  `gatsby-plugin-react-helmet`,
  `gatsby-theme-material-ui`,
  `gatsby-plugin-styled-components`,
]

module.exports = {
  siteMetadata,
  plugins,
}
