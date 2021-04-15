import React from "react"
import { Typography } from "@material-ui/core"

export default function NotFound() {
  return (
    <Typography>
      Page not found{" "}
      <span role="img" aria-label="Thinking face">
        🤔
      </span>
    </Typography>
  )
}
