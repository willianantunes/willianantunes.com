import styled from "styled-components"
import { Box } from "@material-ui/core"

export const DisqusWrapper = styled(Box).attrs({ component: "section" })`
  margin-top: 25px;

  #disqus_thread {
    .publisher-anchor-color {
      background-color: red;
    }
  }
`
