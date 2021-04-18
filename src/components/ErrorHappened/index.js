import React from "react"
import * as S from "./styled"
import PropTypes from "prop-types"

const ErrorHappened = ({ motive, description, children }) => {
  return (
    <S.ErrorWrapper data-testid="error-wrapper">
      <S.MotiveTitle>{motive}</S.MotiveTitle>
      <S.Description dangerouslySetInnerHTML={{ __html: description }} />
      <S.WorkarounderMessage>{children}</S.WorkarounderMessage>
    </S.ErrorWrapper>
  )
}

ErrorHappened.propTypes = {
  motive: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  children: PropTypes.node,
}

export default ErrorHappened
