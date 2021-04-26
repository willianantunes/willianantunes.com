import React from "react"
import * as S from "./styled"
import { PurchaseTag } from "@styled-icons/boxicons-regular"

export default function BlogPost({ title, date, formattedDate, content, timeToRead, tags, image }) {
  const shouldRenderTime = date !== undefined
  const shouldRenderTags = tags !== undefined
  const shouldRenderBlogDetails = shouldRenderTime || shouldRenderTags

  return (
    <S.ArticleWrapper>
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
      <S.ContentWrapper dangerouslySetInnerHTML={{ __html: content }} />
    </S.ArticleWrapper>
  )
}
