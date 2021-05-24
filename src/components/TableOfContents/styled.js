import styled from "styled-components"
import { Box, Typography } from "@material-ui/core"

export const DetailsWrapper = styled(Box).attrs({
  component: "details",
})`
  margin-bottom: ${props => props.theme.spacing(3)}px;

  &[open] {
    & summary:before {
      content: "😍";
    }
  }

  & summary {
    list-style: none;
    cursor: pointer;
    &:before {
      content: "😴";
      margin-right: 10px;
    }
  }

  & ol:first-child {
    margin: ${props => props.theme.spacing(3)}px 0 0 0;
  }
`

export const SummaryTitle = styled(Typography).attrs({
  component: "summary",
  variant: "h5",
})``
