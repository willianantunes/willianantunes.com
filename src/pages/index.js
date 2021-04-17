import React from "react"
import { Typography } from "@material-ui/core"
import Layout from "../components/Layout"
import SEO from "../components/SEO"

const IndexPage = () => {
  const title = "Home"

  return (
    <Layout>
      <SEO title={title} />
      <Typography>This is the index page!</Typography>
    </Layout>
  )
}

export default IndexPage
