import React from "react"
import { Typography } from "@material-ui/core"
import Layout from "../components/Layout"
import SEO from "../components/SEO"

const AboutPage = () => {
  const title = "Labs"

  return (
    <Layout>
      <SEO title={title} />
      <Typography>This is the about page!</Typography>
    </Layout>
  )
}

export default AboutPage
