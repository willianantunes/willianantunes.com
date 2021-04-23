import React from "react"
import { Link } from "gatsby-theme-material-ui"
import { InstagramAlt, Twitter, Youtube, Linkedin, Github, StackOverflow } from "@styled-icons/boxicons-logos"
import { Docker } from "@styled-icons/fa-brands"
import * as S from "./styled"
import { useSiteMetadata } from "../../hooks/use-site-metadata"
import ToggleTheme from "../ToggleTheme"

const menuLinkSetup = [
  {
    label: "Home",
    to: "/",
    testId: "link-home",
  },
  {
    label: "About",
    to: "/about",
    testId: "link-about",
  },
  {
    label: "Labs",
    to: "/labs",
    testId: "link-labs",
  },
]

const AllSiteLinks = () => {
  return menuLinkSetup.map(({ label, to, testId, onClick }) => {
    return (
      <Link key={to} data-testid={testId} to={to} onClick={onClick}>
        {label}
      </Link>
    )
  })
}

const AllSocialLinks = ({ twitter, instagram, youtube, linkedin, dockerhub, github, stackoverflow }) => {
  return (
    <>
      <S.WrapperSocialButton to={twitter}>
        <Twitter />
      </S.WrapperSocialButton>
      <S.WrapperSocialButton to={instagram}>
        <InstagramAlt />
      </S.WrapperSocialButton>
      <S.WrapperSocialButton to={youtube}>
        <Youtube />
      </S.WrapperSocialButton>
      <S.WrapperSocialButton to={linkedin}>
        <Linkedin />
      </S.WrapperSocialButton>
      <S.WrapperSocialButton to={dockerhub}>
        <Docker />
      </S.WrapperSocialButton>
      <S.WrapperSocialButton to={github}>
        <Github />
      </S.WrapperSocialButton>
      <S.WrapperSocialButton to={stackoverflow}>
        <StackOverflow />
      </S.WrapperSocialButton>
    </>
  )
}

const Header = () => {
  const siteMetadata = useSiteMetadata()
  const { name } = siteMetadata.author
  const projectLink = siteMetadata.project

  return (
    <S.MainWrapper>
      <S.ForkMeOnGitHub to={projectLink} data-testid="fork-me-ribbon">
        Fork me{" "}
        <span role="img" aria-label="fork and knife">
          🍴
        </span>
      </S.ForkMeOnGitHub>
      <S.BrandWrapper>
        <S.Title>{name}</S.Title>
      </S.BrandWrapper>
      <S.LinksWrapper>
        <S.SocialLinksWrapper data-testid="social-links-wrapper">
          <AllSocialLinks {...siteMetadata.social} />
        </S.SocialLinksWrapper>
        <S.SiteLinksWrapper data-testid="site-links-wrapper">
          <AllSiteLinks />
        </S.SiteLinksWrapper>
      </S.LinksWrapper>
      <S.ThemeWrapper>
        <ToggleTheme />
      </S.ThemeWrapper>
    </S.MainWrapper>
  )
}

export default Header
