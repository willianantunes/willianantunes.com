# My honest personal website

[![Netlify Status](https://api.netlify.com/api/v1/badges/17cd91a0-e169-48d7-9948-526cb08d7826/deploy-status)](https://app.netlify.com/sites/hungry-leakey-3d2ebb/deploys)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=willianantunes_willianantunes.com&metric=coverage)](https://sonarcloud.io/dashboard?id=willianantunes_willianantunes.com)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=willianantunes_willianantunes.com&metric=ncloc)](https://sonarcloud.io/dashboard?id=willianantunes_willianantunes.com)

It's very early to write something detailed here, isn't it? Soon to come!

## Running the project

Just issue the command `docker-compose up`. It will build the image and run it for you afterwards. If you have an [OAuth Provider configured on Netlify](https://docs.netlify.com/visitor-access/oauth-provider-tokens/), we can even access the admin page, which is `http://localhost:9000/genie`.

If you'd like to run it without docker, first install the packages:

    npm install

Then you can just issue `npm run develop`, but let's say that you want to build it, for that execute the following:

    GOOGLE_TAG_MANAGER_ID=YOUR_GTM_ID \
    SITE_URL=http://localhost:9000/ \
    NETLIFY_CMS_BACKEND_REPO=YOUR_REPO \
    NETLIFY_CMS_BACKEND_BRANCH=YOUR_BRANCH \
    npm run build

Now you can serve it through gatsby (not recommended for production, just as a means to evaluate what was built):

    GOOGLE_TAG_MANAGER_ID=YOUR_GTM_ID \
    SITE_URL=http://localhost:9000/ \
    NETLIFY_CMS_BACKEND_REPO=YOUR_REPO \
    NETLIFY_CMS_BACKEND_BRANCH=YOUR_BRANCH \
    npm run serve

Sadly, even when serving the generated static files, gatsby reads `gatsby-config.js`, that's why you need to set the environment variables.

## I want to use your project. How do I use this template?

That is quite simple. Just follow the bullets:

- You need to change `siteMetadata` const with you own data (see the file [gatsby-config.js](./gatsby-config.js)).
- To run locally properly, update [.env.development](./.env.development) as well.
- Delete the content of [content/blog](./content/blog) folder and create your own very post.

That's it!
