import React, { PureComponent } from "react"
import { v1 as uuidv1 } from "uuid"

class IdControl extends PureComponent {
  handleChange = e => {
    const { onChange } = this.props

    onChange(e.target.value.trim())
  }

  componentDidMount = () => {
    const { value, onChange } = this.props
    const valueWithPreviousOrNewValue = value ? value : uuidv1()
    onChange(valueWithPreviousOrNewValue)
  }

  render() {
    const { value, forID, classNameWrapper } = this.props

    return <input id={forID} disabled className={classNameWrapper} type="text" value={value} onChange={this.handleChange} />
  }
}

export { IdControl }
