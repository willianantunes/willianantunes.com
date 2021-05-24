import styled from "styled-components"
import { Box } from "@material-ui/core"
import { Link } from "gatsby-theme-material-ui"

export const MainWrapper = styled(Box).attrs({
  component: "div",
})`
  margin-bottom: ${props => props.theme.spacing(3)}px;
`

export const ExternalLink = styled(Link).attrs({
  rel: "noreferrer noopener",
  target: "_blank",
})``
