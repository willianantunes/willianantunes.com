import React from "react"
import * as S from "./styled"
import { PurchaseTag } from "@styled-icons/boxicons-regular"

export default function BlogPost({ title, date, formattedDate, content, timeToRead, tags, image }) {
  return (
    <S.ArticleWrapper>
      <S.HeaderWrapper>
        <S.Title>{title}</S.Title>
        <S.BlogDetails>
          <S.DetailsEntry>
            <S.WhenItWasCreated>
              <time dateTime={date}>{formattedDate}</time> • {timeToRead} minute read
            </S.WhenItWasCreated>
          </S.DetailsEntry>
          <S.DetailsEntry>
            <S.Tags>
              <PurchaseTag /> {tags.join(", ")}
            </S.Tags>
          </S.DetailsEntry>
        </S.BlogDetails>
      </S.HeaderWrapper>
      <S.ContentWrapper dangerouslySetInnerHTML={{ __html: content }} />
    </S.ArticleWrapper>
  )
}
