function comparePosts(postA, postB) {
  const dateA = postA.frontmatter.date
  const dateB = postB.frontmatter.date

  return dateA - dateB
}

export function groupByYear(posts) {
  const temporaryObject = {}

  posts.forEach(post => {
    // Converting date
    const data_as_str = post.frontmatter.date
    const date = new Date(data_as_str)
    post.frontmatter.date = date
    const year = date.getFullYear()
    // Filling temporaryObject
    const listOfPosts = temporaryObject[year]
    if (listOfPosts) {
      listOfPosts.push(post)
      listOfPosts.sort(comparePosts)
      temporaryObject[year] = listOfPosts
    } else {
      temporaryObject[year] = [post]
    }
  })
  // Preparing final object to be returned
  const orderedKeys = Object.keys(temporaryObject).reverse()
  return orderedKeys.flatMap(key => [{ year: key, posts: temporaryObject[key].reverse() }])
}

export function groupLevels(headings) {
  const copiedHeadings = JSON.parse(JSON.stringify(headings))

  const reducer = (accumulator, currentHeading) => {
    const shouldPushFirstElement = accumulator.length === 0
    if (shouldPushFirstElement) {
      accumulator.push(currentHeading)
      return accumulator
    } else {
      const lastHeading = accumulator.pop()
      const createHeadingProperty = lastHeading.depth !== currentHeading.depth

      if (createHeadingProperty) {
        let configuredHeading = lastHeading.headings
        if (configuredHeading) {
          // Recursive call
          configuredHeading = reducer(configuredHeading, currentHeading)
        } else {
          // Just fill with the first element
          configuredHeading = [currentHeading]
        }
        lastHeading.headings = configuredHeading
        accumulator.push(lastHeading)
        return accumulator
      } else {
        accumulator.push(lastHeading, currentHeading)
        return accumulator
      }
    }
  }

  return copiedHeadings.reduce(reducer, [])
}
