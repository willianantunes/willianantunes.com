---
id: 3a77fa80-c55b-11ec-a640-77b6e3b4cbbe
title: Add claims to JWT through Actions on Auth0
date: 2022-04-26T12:37:31.870Z
cover: /assets/posts/blog-22-add-claims-to-jwt-through-actions-on-auth0.png
description: Have you ever heard of Auth0 Actions? Let's use one of its flows to
  add custom claims into an ID Token.
tags:
  - auth0
  - jwt
---
Recently I came up with a solution to handle single sign-on (SSO) internally for all enterprise applications inside the company. This scenario is typically known as [B2E](https://auth0.com/docs/get-started/architecture-scenarios/b2e) or workforce if you look at the Gartner report about [Critical Capabilities for Access Management](https://www.gartner.com/en/documents/4008096). So, for example, if a company uses [Azure AD](https://azure.microsoft.com/en-us/services/active-directory/) for its employees, their internal applications can use it to grant access (authentication), and utilize it to allow a user to execute something or not (permission).

## What will we do

This post is the first of two where I will demonstrate how we can achieve SSO with Django applications for the B2E scenario, focused on [The Django admin site](https://docs.djangoproject.com/en/4.0/ref/contrib/admin/), through Auth0.

## Managing permissions through claims

The idea is quite simple: after the user's login, we'll include all groups he has inside a custom claim. Of course, this strategy is not production-ready, but let's keep things simple for the article's sake. Let's see an image that illustrates the whole flow:

![Sequence diagram that shows 4 columns. It has the user, the admin portal, the auth0 tenant, and the XYZ company. Basically it demonstrates the authentication process among these entities.](/assets/posts/blog-22-order-1-image-1-sequential-diagram.png "Sequence diagram.")

The dashed orange circle denotes the step where we'll add a custom claim.

## Adding Action during post-login trigger

To add an ***Action***, we first should choose one of the flows available:

![Actions has 6 flows: login, machine to machine, pre user registration, post user registration, post change password, and send phone messages.](/assets/posts/blog-22-order-2-image-2-flows.png "Flows available in Actions.")

Let's pick ***login flow*** following the [sequence diagram we saw earlier](#managing-permissions-through-claims). Next, click on the plus and symbol and choose ***Build Custom***.

![Where you should click to build a custom action.](/assets/posts/blog-22-order-3-image-3-build-custom.png "Build custom action.")

Put the name ***Enrich JWT with Groups from AD*** and click on *Create*.

![To create an action, you should give it a name, choose a trigger, and then its runtime.](/assets/posts/blog-22-order-4-image-4-trigger-create.png "Action details.")

You should see the following image:

![When you create an action, you goes to its "development area". From there you can code and deploy the action.](/assets/posts/blog-22-order-5-image-5-trigger-code.png "Action editor interface.")

Reading the methods that we can implement, we should pick the `onExecutePostLogin`. The `onContinuePostLogin` allows us to require further steps after authentication before letting the user continue to the application where the flow started. The [Redirect with Actions article](https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/redirect-with-actions) can give you further details.

Now, let's see the code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  // Collecting secrets
  const tenant = event.secrets.TENANT
  const audience = event.secrets.AUDIENCE
  const clientId = event.secrets.APP_CLIENT_ID
  const clientSecret = event.secrets.APP_CLIENT_SECRET
  // Creating management API
  const ManagementClient = require("auth0").ManagementClient
  const managementClient = new ManagementClient({
    domain: `${tenant}.us.auth0.com`,
    scope: "read:users",
    clientId,
    clientSecret,
    audience,
  })
  // Main routine
  const userId = event.user.user_id
  const user = await managementClient.getUser({ id: userId })
  const shouldEnrichJWTWithGroups = user.hasOwnProperty("groups")
  if (shouldEnrichJWTWithGroups) {
    const claimKey = "https://www.willianantunes.com/ad/groups"
    const claimValue = user.groups
    api.idToken.setCustomClaim(claimKey, claimValue)
  }
}
```

An essential thing to mention here is the part where we use the Management API. It has [rate limits](https://auth0.com/docs/troubleshoot/customer-support/operational-policies/rate-limit-policy/management-api-endpoint-rate-limits), so we're leaving it this way just for the article's sake. With that said, let's explain the script:

1. First, we collect must have secrets.
2. We use the secrets from the previous step to instantiate a class to deal with the Management API.
3. We retrieve all user attributes given his ID.
4. If the user has the root attribute `groups`, we add it as a [custom claim](https://auth0.com/docs/secure/tokens/json-web-tokens/create-namespaced-custom-claims) in the [ID token](https://auth0.com/docs/secure/tokens/id-tokens).

You might be thinking: Why use the Management API if the Action [delivers user attributes](https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object), including application metadata? Sadly, some attributes are not available, and `groups` is one of them. I found [this explanation](https://community.auth0.com/t/user-object-in-actions-is-missing-groups/64189/3?u=willianantunes) on Auth0 Community, but still, it's not available.

Depending on how you configure your enterprise connection with the directory service, it may include the root attribute `groups`. For example, look at how I configured mine for testing purposes:

![When you configure an enterprise connection for Azure AD, you can selected which attributes you want to retrieve. "Groups" is one for instance.](/assets/posts/blog-22-order-6-image-6-enterprise-connection-azure-ad.png "Azure AD enterprise connection details.")

### Action limitations

Consulting [Auth0 Management API](https://auth0.com/docs/api/management/v2) all the time is cumbersome. Sadly we can't circumvent that because of current Actions limitations. I recommend you read [this community post](https://community.auth0.com/t/cannot-access-mapped-saml-properties-inside-custom-action/63615/3?u=willianantunes) where there is an official statement by the Auth0 community moderator.

### Why not Rules?

The problem with [Auth0 Rules](https://auth0.com/docs/customize/rules) is its [expected deprecation sometime in the second half of 2022](https://community.auth0.com/t/how-long-will-you-support-rules/76368/3?u=willianantunes). Although it has many [OOTB](https://en.wikipedia.org/wiki/Out_of_the_box_(feature)#:~:text=An%20out%2Dof%2Dthe%2D,product%20is%20placed%20in%20service.) solutions, Actions will rule over it soon. You can consult [Actions marketplace](https://marketplace.auth0.com/features/actions) and check out some samples that can help you migrate or create new things.

## Conclusion and next steps

Our next article will use the post-login trigger we wrote here with a full-blown solution, including [Django](https://www.djangoproject.com/) with [Mozilla Django OIDC](https://github.com/mozilla/mozilla-django-oidc) and [Auth0 Deploy CLI.](https://www.willianantunes.com/blog/2022/02/getting-to-know-auth0-deploy-cli-with-a-practical-scenario/) Stay tuned 😉!

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/04/add-claims-jwt-actions-auth0).

Posted listening to [A nova bossa é violão, Paulinho Nogueira](https://youtu.be/j159kTbE2Zg) 🎶.
