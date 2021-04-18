import React, { PureComponent } from "react"

class TagsField extends PureComponent {
  handleChange = e => {
    const { field, onChange } = this.props
    const separator = field.get("separator", ",")

    const { value } = e?.target

    if (!value) return onChange([])

    const tags = value.split(separator)?.map(tag => tag?.trim())

    onChange(tags)
  }

  render() {
    const { field, value, forID, classNameWrapper } = this.props

    const separator = field.get("separator", ",")

    return (
      <input
        id={forID}
        className={classNameWrapper}
        type="text"
        value={value ? value.join(separator) : ""}
        onChange={this.handleChange}
      />
    )
  }
}

export { TagsField }
