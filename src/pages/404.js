import React from "react"
import { Link } from "gatsby-theme-material-ui"
import Layout from "../components/Layout"
import SEO from "../components/SEO"
import ErrorHappened from "../components/ErrorHappened"

const NotFoundPage = () => {
  const title = "404: Not Found"

  const motive = "404"
  const description = `Page not found <span role="img" aria-label="Thinking face">🤔</span>`

  return (
    <Layout>
      <SEO title={title} />
      <ErrorHappened motive={motive} description={description}>
        But here’s something you can always find — <Link to="/">our home page</Link>!
      </ErrorHappened>
    </Layout>
  )
}

export default NotFoundPage
