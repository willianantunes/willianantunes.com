import { useStaticQuery, graphql } from "gatsby"

/**
 * https://css-tricks.com/how-to-the-get-current-page-url-in-gatsby/
 */
export function useSiteMetadata() {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            siteUrl
            name
            description
            shortName
            project
            projectLicense
            author {
              name
            }
            social {
              dockerhub
              github
              instagram
              stackoverflow
              linkedin
              twitter
              youtube
              hackerrank
              strava
              leetcode
            }
          }
        }
      }
    `
  )
  return site.siteMetadata
}
