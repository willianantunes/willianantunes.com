import React from "react"
import * as S from "./styled"
import Header from "../Header"
import Footer from "../Footer"
import PropTypes from "prop-types"
import GDPRConsent from "../GDPRConsent"

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <S.MainWrapper>{children}</S.MainWrapper>
      <Footer />
      <GDPRConsent />
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
