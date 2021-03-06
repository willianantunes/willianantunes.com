import CMS from "netlify-cms-app"
import { NETLIFY_CMS_LOCAL_BACKEND, NETLIFY_CMS_BACKEND_REPO, NETLIFY_CMS_BACKEND_BRANCH } from "../config/settings.js"
import { TagsField, TagsPreview } from "./widgets/Tags"
import { IdControl, IdPreview } from "./widgets/Id"

CMS.registerWidget("tags", TagsField, TagsPreview)
CMS.registerWidget("id", IdControl, IdPreview)
CMS.registerEditorComponent({
  id: "youtube",
  label: "YouTube",
  fields: [
    {
      name: "url",
      label: "Youtube video URL",
      widget: "string",
    },
  ],
  pattern: /^`youtube:\s(.*)`$/,
  fromBlock: function (match) {
    return {
      url: match[1],
    }
  },
  toBlock: function (obj) {
    return "`youtube: " + obj.url + "`"
  },
  toPreview: function (obj) {
    return obj.url
  },
})

function buildBackEndConfiguration() {
  if (NETLIFY_CMS_LOCAL_BACKEND) {
    return {
      name: "git-gateway",
    }
  } else {
    return {
      name: "github",
      repo: NETLIFY_CMS_BACKEND_REPO,
      branch: NETLIFY_CMS_BACKEND_BRANCH,
    }
  }
}

const backEndConfiguration = buildBackEndConfiguration()
const initOptions = {
  config: {
    local_backend: NETLIFY_CMS_LOCAL_BACKEND,
    backend: backEndConfiguration,
  },
}

console.debug(`Built configuration: ${JSON.stringify(initOptions)}`)

CMS.init(initOptions)
