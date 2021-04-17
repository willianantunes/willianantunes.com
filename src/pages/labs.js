import React from "react"
import { Typography } from "@material-ui/core"
import Layout from "../components/Layout"
import SEO from "../components/SEO"

const LabsPage = () => {
  const title = "Labs"

  return (
    <Layout>
      <SEO title={title} />
      <Typography>This is the labs page!</Typography>
    </Layout>
  )
}

export default LabsPage
