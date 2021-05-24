import React from "react"
import PropTypes from "prop-types"
import * as S from "./styled"
import { Link } from "gatsby-theme-material-ui"

function renderHeadings(headings) {
  return (
    <ol>
      {headings.map(heading => {
        const key = heading.id
        const anchor = `#${heading.id}`
        const label = heading.value

        return (
          <li key={key}>
            <Link to={anchor}>{label}</Link>
            {heading.headings && renderHeadings(heading.headings)}
          </li>
        )
      })}
    </ol>
  )
}

const TableOfContents = ({ headings }) => {
  return (
    <S.DetailsWrapper>
      <S.SummaryTitle>Table of contents</S.SummaryTitle>
      {renderHeadings(headings)}
    </S.DetailsWrapper>
  )
}

TableOfContents.propTypes = {
  headings: PropTypes.arrayOf(PropTypes.object),
}

export default TableOfContents
