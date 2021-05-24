import React from "react"
import * as S from "./styled"
import { PurchaseTag } from "@styled-icons/boxicons-regular"
import PropTypes from "prop-types"
import TableOfContents from "../TableOfContents"

const BlogPost = ({ title, date, formattedDate, content, timeToRead, tags, image, headings }) => {
  const shouldRenderTime = date !== undefined
  const shouldRenderTags = tags !== undefined
  const shouldRenderBlogDetails = shouldRenderTime || shouldRenderTags

  return (
    <S.ArticleWrapper data-testid="blog-post-article-wrapper">
      <S.HeaderWrapper>
        <S.Title>{title}</S.Title>
        {shouldRenderBlogDetails && (
          <S.BlogDetails>
            {shouldRenderTime && (
              <S.DetailsEntry>
                <S.WhenItWasCreated>
                  <time dateTime={date}>{formattedDate}</time> • {timeToRead} minute read
                </S.WhenItWasCreated>
              </S.DetailsEntry>
            )}
            {shouldRenderTags && (
              <S.DetailsEntry>
                <S.Tags>
                  <PurchaseTag /> {tags.join(", ")}
                </S.Tags>
              </S.DetailsEntry>
            )}
          </S.BlogDetails>
        )}
      </S.HeaderWrapper>
      {headings && <TableOfContents headings={headings} />}
      <S.ContentWrapper dangerouslySetInnerHTML={{ __html: content }} />
    </S.ArticleWrapper>
  )
}

BlogPost.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  date: PropTypes.string,
  formattedDate: PropTypes.string,
  timeToRead: PropTypes.number,
  tags: PropTypes.arrayOf(PropTypes.string),
  image: PropTypes.string,
  headings: PropTypes.arrayOf(PropTypes.object),
}

export default BlogPost
