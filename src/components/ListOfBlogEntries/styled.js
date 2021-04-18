import styled from "styled-components"
import { Box, Typography } from "@material-ui/core"

export const MainWrapper = styled(Box).attrs({
  component: "article",
})`
  main &:last-child section:last-child {
    margin-bottom: unset;
  }
`

export const YearTitle = styled(Typography).attrs({
  component: "h2",
  variant: "h4",
  align: "center",
})``

export const BlogEntryWrapper = styled(Box).attrs({
  component: "section",
})`
  margin: ${props => props.theme.spacing(4)}px 0;
`

export const BlogEntryTitle = styled(Typography).attrs({
  component: "h3",
  align: "center",
})``

export const Tags = styled(Typography).attrs({ align: "center" })`
  & svg {
    width: 15px;
    margin-right: ${props => props.theme.spacing(0)}px;
  }
  font-size: small;
`
