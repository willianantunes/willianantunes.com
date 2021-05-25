import styled from "styled-components"
import { Box } from "@material-ui/core"
import { Link } from "gatsby-theme-material-ui"

export const MainWrapper = styled(Box).attrs({
  component: "div",
})`
  margin-top: ${props => props.theme.spacing(3)}px;
  margin-bottom: ${props => props.theme.spacing(3)}px;
  text-align: center;
`

export const ExternalLink = styled(Link).attrs({
  rel: "noreferrer noopener",
  target: "_blank",
})``
