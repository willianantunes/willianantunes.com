import React from "react"
import { Typography } from "@material-ui/core"
import Layout from "../components/Layout"
import SEO from "../components/SEO"
import { Link } from "gatsby-theme-material-ui"

const LabsPage = () => {
  const title = "Labs"

  return (
    <Layout>
      <SEO title={title} />
      <Typography>
        This <strong>labs page</strong> is under construction{" "}
        <span role="img" aria-label="grinning face with sweat">
          😅
        </span>
        !
      </Typography>
      <br />
      <Typography>
        As this is open-source, you can follow it here{" "}
        <Link to="https://github.com/willianantunes/willianantunes.com" target="_blank" rel="noreferrer noopener">
          willianantunes/willianantunes.com
        </Link>{" "}
        <span role="img" aria-label="eyes">
          👀
        </span>
      </Typography>
    </Layout>
  )
}

export default LabsPage
