import styled from "styled-components"
import { Box, Typography } from "@material-ui/core"
import React from "react"

export const ErrorWrapper = styled(Box)`
  & p {
    margin-top: ${props => props.theme.spacing(3)}px;
  }
`

export const MotiveTitle = styled(Typography).attrs({
  component: "h1",
  variant: "h3",
  align: "center",
})``

export const Description = styled(Typography).attrs({
  component: "h2",
  variant: "h4",
  align: "center",
  color: "textSecondary",
})``

export const WorkarounderMessage = styled(Typography).attrs({
  align: "center",
})``
