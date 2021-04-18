import React from "react"
import PropTypes from "prop-types"
import { Link } from "gatsby-theme-material-ui"
import { PurchaseTag } from "@styled-icons/boxicons-regular"
import * as S from "./styled"

const ListOfBlogEntries = ({ year, posts }) => {
  const BlogEntries = () => {
    return posts.map(({ frontmatter, fields }, index) => {
      const title = frontmatter.title
      const tags = frontmatter.tags
      const whereTheBlogEntryIs = fields.path

      return (
        <S.BlogEntryWrapper key={index}>
          <S.BlogEntryTitle>
            <Link to={whereTheBlogEntryIs}>{title}</Link>
          </S.BlogEntryTitle>
          <S.Tags>
            <PurchaseTag /> {tags.join(", ")}
          </S.Tags>
        </S.BlogEntryWrapper>
      )
    })
  }

  return (
    <S.MainWrapper>
      <S.YearTitle>{year}</S.YearTitle>
      <BlogEntries />
    </S.MainWrapper>
  )
}

ListOfBlogEntries.propTypes = {
  year: PropTypes.string.isRequired,
  posts: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default ListOfBlogEntries
