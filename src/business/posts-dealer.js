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
