export function getMetaByName(metaName) {
  const metas = document.getElementsByTagName("meta")

  for (let i = 0; i < metas.length; i += 1) {
    if (metas[i].getAttribute("name") === metaName) {
      return metas[i].getAttribute("content")
    }
  }

  return null
}

export function getMetaByProperty(propertyName) {
  const metas = document.getElementsByTagName("meta")

  for (let i = 0; i < metas.length; i += 1) {
    if (metas[i].getAttribute("property") === propertyName) {
      return metas[i].getAttribute("content")
    }
  }

  return null
}
