import styled from "styled-components"
import { Container } from "@material-ui/core"

export const MainWrapper = styled(Container).attrs({
  component: "main",
})`
  border-top: 1px solid ${props => props.theme.palette.primary.light};
  padding-top: ${props => props.theme.spacing(4)}px;
  padding-bottom: ${props => props.theme.spacing(4)}px;

  ${props => props.theme.breakpoints.down("md")} {
    padding-left: 25px;
    padding-right: 25px;
  }
`
