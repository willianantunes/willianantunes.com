import React from "react"
import PropTypes from "prop-types"
import * as S from "./styled"
import { TARGET_REPO_BRANCH_CONTRIBUTION } from "../../config/settings.js"
import { Typography } from "@material-ui/core"

const ContributionDetails = ({ pathWhereEntryIsSaved }) => {
  const contentFolder = TARGET_REPO_BRANCH_CONTRIBUTION.split("/").pop()
  const whereEntryIsSavedWithoutContentFolder = pathWhereEntryIsSaved.split(contentFolder).pop()
  const urlWhereEntryCanBeEdited = TARGET_REPO_BRANCH_CONTRIBUTION + whereEntryIsSavedWithoutContentFolder

  return (
    <S.MainWrapper>
      <Typography>
        Have you found any mistakes{" "}
        <span role="img" aria-label="Eyes">
          👀
        </span>
        ? Feel free to submit a PR{" "}
        <S.ExternalLink data-testid="contribution-pr-blog-entry-link" to={urlWhereEntryCanBeEdited}>
          editing this blog entry{" "}
          <span role="img" aria-label="Grinning face with smiling eyes">
            😄
          </span>
        </S.ExternalLink>
        .
      </Typography>
    </S.MainWrapper>
  )
}

ContributionDetails.propTypes = {
  pathWhereEntryIsSaved: PropTypes.string,
}

export default ContributionDetails
