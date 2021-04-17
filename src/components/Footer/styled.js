import styled from "styled-components"
import { Box, Container } from "@material-ui/core"
import { Link } from "gatsby-theme-material-ui"
import React from "react"

export const MainWrapper = styled(Container).attrs({
  component: "footer",
})`
  border-top: 1px solid ${props => props.theme.palette.primary.light};
  padding-top: ${props => props.theme.spacing(4)}px;
  padding-bottom: ${props => props.theme.spacing(4)}px;
`

export const SmallDetailsWrapper = styled(Box)`
  text-align: center;
`

export const CustomLink = styled(Link).attrs({
  color: "inherit",
  rel: "noreferrer noopener",
  target: "_blank",
})`
  &:before {
    content: "•";
    display: inline-block;
    margin: 0 ${props => props.theme.spacing(1)}px;
  }
`
