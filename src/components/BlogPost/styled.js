import styled from "styled-components"
import { Box, Typography } from "@material-ui/core"

export const ArticleWrapper = styled(Box).attrs({
  component: "article",
})``

export const HeaderWrapper = styled(Box).attrs({
  component: "header",
})``

export const Title = styled(Typography).attrs({
  component: "h1",
  variant: "h2",
  align: "center",
})`
  &:only-child {
    padding-bottom: ${props => props.theme.spacing(4)}px;
  }
`

export const BlogDetails = styled(Box)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${props => props.theme.spacing(4)}px;
  padding: ${props => props.theme.spacing(4)}px 0;

  ${props => props.theme.breakpoints.up("sm")} {
    flex-direction: row;
  }
`

export const DetailsEntry = styled(Box)``

export const WhenItWasCreated = styled(Typography).attrs({ align: "center" })`
  font-size: small;
`

export const Tags = styled(Typography).attrs({ align: "center" })`
  & svg {
    width: 15px;
    margin-right: ${props => props.theme.spacing(0)}px;
  }
  font-size: small;
`

// TODO: Refactor this! By the way, it was copied from the following with some modifications:
// https://github.com/gatsbyjs/gatsby-starter-blog/blob/d8ec204b786d52c73f3ca0e748b0290d080860fd/src/style.css
export const ContentWrapper = styled(Box).attrs({
  component: "section",
})`
  --maxWidth-none: "none";
  --maxWidth-xs: 20rem;
  --maxWidth-sm: 24rem;
  --maxWidth-md: 28rem;
  --maxWidth-lg: 32rem;
  --maxWidth-xl: 36rem;
  --maxWidth-2xl: 42rem;
  --maxWidth-3xl: 48rem;
  --maxWidth-4xl: 56rem;
  --maxWidth-full: "100%";
  --maxWidth-wrapper: var(--maxWidth-2xl);
  --spacing-px: "1px";
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  --spacing-20: 5rem;
  --spacing-24: 6rem;
  --spacing-32: 8rem;
  --fontFamily-sans: Montserrat, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --fontFamily-serif: "Merriweather", "Georgia", Cambria, "Times New Roman", Times, serif;
  --font-body: var(--fontFamily-serif);
  --font-heading: var(--fontFamily-sans);
  --fontWeight-normal: 400;
  --fontWeight-medium: 500;
  --fontWeight-semibold: 600;
  --fontWeight-bold: 700;
  --fontWeight-extrabold: 800;
  --fontWeight-black: 900;
  --fontSize-root: 16px;
  --lineHeight-none: 1;
  --lineHeight-tight: 1.1;
  --lineHeight-normal: 1.5;
  --lineHeight-relaxed: 1.625;
  /* 1.200 Minor Third Type Scale */
  --fontSize-1: 1rem;
  --fontSize-2: 1.2rem;
  --fontSize-3: 1.44rem;
  --fontSize-4: 1.728rem;
  --fontSize-5: 2.5rem;
  --fontSize-6: 3.5rem;
  --color-primary: ${props => props.theme.palette.primary.light};
  --color-text: ${props => props.theme.palette.text.primary};
  --color-text-light: ${props => props.theme.palette.text.primary};
  --color-heading: ${props => props.theme.palette.primary};
  --color-accent: ${props => props.theme.palette.divider};

  *,
  :after,
  :before {
    box-sizing: border-box;
  }

  line-height: var(--lineHeight-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: var(--font-body);
  font-size: var(--fontSize-1);
  color: var(--color-text);

  footer {
    padding: var(--spacing-6) var(--spacing-0);
  }

  hr {
    background: var(--color-accent);
    height: 1px;
    border: 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-heading);
    margin-top: var(--spacing-12);
    margin-bottom: var(--spacing-6);
    line-height: var(--lineHeight-tight);
    letter-spacing: -0.025em;
  }

  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: var(--fontWeight-bold);
    color: var(--color-heading);
  }

  h1 {
    font-weight: var(--fontWeight-black);
    font-size: var(--fontSize-6);
    color: var(--color-heading);
  }

  h2 {
    font-size: var(--fontSize-5);
  }

  h3 {
    font-size: var(--fontSize-4);
  }

  h4 {
    font-size: var(--fontSize-3);
  }

  h5 {
    font-size: var(--fontSize-2);
  }

  h6 {
    font-size: var(--fontSize-1);
  }

  h1 > a {
    color: inherit;
    text-decoration: none;
  }

  h2 > a,
  h3 > a,
  h4 > a,
  h5 > a,
  h6 > a {
    text-decoration: none;
    color: inherit;
  }

  a.anchor.before > svg {
    fill: var(--color-text);
  }

  /* Prose */

  p {
    line-height: var(--lineHeight-relaxed);
    --baseline-multiplier: 0.179;
    --x-height-multiplier: 0.35;
    margin: var(--spacing-0) var(--spacing-0) var(--spacing-8) var(--spacing-0);
    padding: var(--spacing-0);
  }

  ul,
  ol {
    margin-left: var(--spacing-0);
    margin-right: var(--spacing-0);
    //padding: var(--spacing-0);
    margin-bottom: var(--spacing-8);
    list-style-position: outside;
    list-style-image: none;
  }

  ul li,
  ol li {
    padding-left: var(--spacing-0);
    margin-bottom: calc(var(--spacing-8) / 2);
  }

  li > p {
    margin-bottom: calc(var(--spacing-8) / 2);
  }

  li *:last-child {
    margin-bottom: var(--spacing-0);
  }

  li > ul {
    margin-left: var(--spacing-8);
    margin-top: calc(var(--spacing-8) / 2);
  }

  blockquote {
    color: var(--color-text-light);
    margin-right: var(--spacing-8);
    border-left: var(--spacing-1) solid ${props => props.theme.palette.primary.main};
    font-size: var(--fontSize-2);
    font-style: italic;
    margin-bottom: var(--spacing-8);
    padding: var(--spacing-0) var(--spacing-0) var(--spacing-0) var(--spacing-4);
    margin-left: var(--spacing-0);
  }

  blockquote > :last-child {
    margin-bottom: var(--spacing-0);
  }

  blockquote > ul,
  blockquote > ol {
    list-style-position: inside;
  }

  table {
    width: 100%;
    margin-bottom: var(--spacing-8);
    border-collapse: collapse;
    border-spacing: 0.25rem;
  }

  table thead tr th {
    border-bottom: 1px solid var(--color-accent);
  }

  /* Link */

  a {
    color: var(--color-primary);
  }

  a:hover,
  a:focus {
    text-decoration: none;
  }

  header h1 {
    margin: var(--spacing-0) var(--spacing-0) var(--spacing-4) var(--spacing-0);
    margin-bottom: 0;
    text-align: center;
  }

  header p {
    font-family: var(--font-heading);
    margin: var(--spacing-0) var(--spacing-0) var(--spacing-8) var(--spacing-0);
    font-size: 0.83255rem;
    line-height: 1.75rem;
  }

  .gatsby-highlight {
    margin-bottom: var(--spacing-8);
  }

  img {
    width: 100%;
  }
`
