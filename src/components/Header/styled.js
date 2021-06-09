import styled from "styled-components"
import { Box, Container, Typography } from "@material-ui/core"
import { IconButton, Link } from "gatsby-theme-material-ui"

export const MainWrapper = styled(Container).attrs({
  component: "header",
})`
  padding-top: ${props => props.theme.spacing(4)}px;
  padding-bottom: ${props => props.theme.spacing(4)}px;
`

export const ForkMeOnGitHub = styled(Link).attrs({
  rel: "noreferrer noopener",
  target: "_blank",
})`
  // https://www.kirilv.com/fork-ribbon-css-builder/
  // Positioning
  position: fixed;
  padding: 5px 45px;
  width: 170px;
  // Top left of the page
  top: 12px;
  left: -44px;
  transform: rotate(315deg);
  z-index: 50;
  // Effects with some shadow
  box-shadow: 0 0 0 3px ${props => props.theme.palette.primary.main}, 0 0 20px -3px rgba(0, 0, 0, 0.5);
  text-shadow: 0 0 0 ${props => props.theme.palette.secondary.main}, 0 0 5px rgba(0, 0, 0, 0.3);
  // Looks
  background-color: ${props => props.theme.palette.primary.main};
  color: #ffffff;
  font-size: 10px;
  font-family: sans-serif;
  text-decoration: none;
  font-weight: bold;
  // Ribbon effects */
  border: 2px dotted ${props => props.theme.palette.text.primary};
  letter-spacing: 0.5px;
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
  gap: 30px;
  & a {
    text-transform: uppercase;
  }
  padding-top: 12px;

  ${props => props.theme.breakpoints.up("sm")} {
    gap: 50px;
  }
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
  z-index: 50;
`
