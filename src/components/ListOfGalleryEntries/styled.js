import styled from "styled-components"
import { Box, Card, CardMedia } from "@material-ui/core"
import { CardActionArea } from "gatsby-theme-material-ui"

export const MainWrapper = styled(Box).attrs({
  component: "section",
})`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: space-evenly;
`

export const GalleryEntryWrapper = styled(Card)`
  max-width: 345px;
  height: 100%;
`

export const GalleryEntryCover = styled(CardMedia)`
  height: 160px;
`

export const GalleryEntryCardActionArea = styled(CardActionArea).attrs({
  rel: "noreferrer noopener",
  target: "_blank",
})``
