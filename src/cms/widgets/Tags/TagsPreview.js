import React, { PureComponent } from "react"
import styled from "styled-components"

const CustomUl = styled.ul`
  display: flex;
  list-style-type: none;
  margin: 0;
  padding: 0;

  & > li {
    padding: 0.5rem;
    border-radius: 4px;
    background-color: #eeeeee;
  }

  & > li:not(:last-child) {
    margin-right: 0.5rem;
  }
`

class TagsPreview extends PureComponent {
  render() {
    const { value } = this.props

    return (
      value.length > 0 && (
        <div>
          <strong>Tags</strong>
          <CustomUl>
            {value?.map((value, index) => (
              <li key={index}>{value}</li>
            ))}
          </CustomUl>
        </div>
      )
    )
  }
}

export { TagsPreview }
