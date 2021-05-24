import styled from "styled-components"
import { Box, Card } from "@material-ui/core"

export const LinksWrapper = styled(Box).attrs({
  component: "nav",
})`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: ${props => props.theme.spacing(3)}px;
  width: 100%;

  & .MuiPaper-root {
    flex-basis: calc(50%);
  }

  & .MuiPaper-root:only-child {
    text-align: center;
  }

  & .MuiPaper-root:not(:only-child):first-child {
    text-align: right;
  }
`

export const EntryDetails = styled(Card)``
