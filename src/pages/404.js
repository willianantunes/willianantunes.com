import React from "react"
import { Box, Typography } from "@material-ui/core"
import { Link } from "gatsby-theme-material-ui"
import Layout from "../components/Layout"
import SEO from "../components/SEO"
import styled from "styled-components"

const ErrorWrapper = styled(Box)`
  & p {
    margin-top: ${props => props.theme.spacing(3)}px;
  }
`

const NotFoundPage = () => {
  const title = "404: Not Found"

  return (
    <Layout>
      <SEO title={title} />
      <ErrorWrapper>
        <Typography component="h1" variant="h3" align="center">
          404
        </Typography>
        <Typography component="h2" variant="h4" align="center" color={"textSecondary"}>
          Page not found{" "}
          <span role="img" aria-label="Thinking face">
            {" "}
            🤔
          </span>
        </Typography>
        <Typography align="center">
          But here’s something you can always find — <Link to="/">our home page</Link>!
        </Typography>
      </ErrorWrapper>
    </Layout>
  )
}

export default NotFoundPage
