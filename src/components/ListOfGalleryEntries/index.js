import React from "react"
import PropTypes from "prop-types"
import * as S from "./styled"
import { CardContent, Typography } from "@material-ui/core"
import { useSiteMetadata } from "../../hooks/use-site-metadata"

const ListOfGalleryEntries = ({ entries }) => {
  const { siteUrl } = useSiteMetadata()

  const AllGalleryEntries = () => {
    return entries.map(({ date, title, description, projectLink, cover }, index) => {
      const image = `${siteUrl}${cover.publicURL}`
      const formattedDate = new Date(date).getFullYear()

      return (
        <S.GalleryEntryWrapper key={index}>
          <S.GalleryEntryCardActionArea to={projectLink}>
            <S.GalleryEntryCover image={image} />
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                {title}
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p">
                {description}
              </Typography>
              <Typography variant="overline" component="p">
                <time dateTime={formattedDate}>{formattedDate}</time>
              </Typography>
            </CardContent>
          </S.GalleryEntryCardActionArea>
        </S.GalleryEntryWrapper>
      )
    })
  }

  return (
    <S.MainWrapper data-testid="gallery-entries-wrapper">
      <AllGalleryEntries />
    </S.MainWrapper>
  )
}

ListOfGalleryEntries.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default ListOfGalleryEntries
