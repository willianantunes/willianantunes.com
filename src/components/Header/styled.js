import styled from "styled-components"
import { Box, Container, Typography } from "@material-ui/core"
import { IconButton } from "gatsby-theme-material-ui"

export const MainWrapper = styled(Container).attrs({
  component: "header",
})`
  padding-top: ${props => props.theme.spacing(4)}px;
  padding-bottom: ${props => props.theme.spacing(4)}px;
`

export const BrandWrapper = styled(Box)``

export const Title = styled(Typography).attrs({
  component: "h1",
  variant: "h6",
  align: "center",
})``

export const LinksWrapper = styled(Box).attrs({
  component: "nav",
})``

export const WrapperSocialButton = styled(IconButton).attrs({
  color: "inherit",
  rel: "noreferrer noopener",
  target: "_blank",
})`
  & svg {
    width: 20px;
  }
`

export const SiteLinksWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  gap: 50px;
  & a {
    text-transform: uppercase;
  }
  padding-top: 12px;
`

export const SocialLinksWrapper = styled(Box)`
  display: flex;
  justify-content: center;
`

export const ThemeWrapper = styled(Box)`
  // Not the ideal, but good enough to start with
  // TODO: Put it fixed relative to container
  position: fixed;
  top: 20px;
  right: 20px;
`
