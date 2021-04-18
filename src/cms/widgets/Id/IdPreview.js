import React, { PureComponent } from "react"

class IdPreview extends PureComponent {
  render() {
    const { value } = this.props

    return <p>{value}</p>
  }
}

export { IdPreview }
