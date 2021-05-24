import React from "react"
import PropTypes from "prop-types"
import * as S from "./styled"
import { CardActionArea } from "gatsby-theme-material-ui"
import { CardContent, Typography } from "@material-ui/core"

function applyEntryDetails(entry) {
  if (entry) {
    return {
      title: entry.frontmatter.title,
      date: entry.frontmatter.date,
      formattedDate: entry.frontmatter.formattedDate,
      path: entry.fields.path,
    }
  }
}

function createEntryDetails(entry, label) {
  return (
    <S.EntryDetails>
      <CardActionArea to={entry.path}>
        <CardContent>
          <Typography variant="subtitle2" component="p">
            {label}
          </Typography>
          <Typography gutterBottom variant="body2" component="h1">
            {entry.title}
          </Typography>
          <Typography variant="caption" component="p">
            <time dateTime={entry.date}>{entry.formattedDate}</time>
          </Typography>
        </CardContent>
      </CardActionArea>
    </S.EntryDetails>
  )
}

const PreviousNextEntries = ({ previousEntry, nextEntry }) => {
  const previousEntryDetails = applyEntryDetails(previousEntry)
  const nextEntryDetails = applyEntryDetails(nextEntry)

  return (
    <S.LinksWrapper>
      {previousEntryDetails && createEntryDetails(previousEntryDetails, "Previous")}
      {nextEntryDetails && createEntryDetails(nextEntryDetails, "Next")}
    </S.LinksWrapper>
  )
}

PreviousNextEntries.propTypes = {
  previousEntry: PropTypes.object,
  nextEntry: PropTypes.object,
}

export default PreviousNextEntries
