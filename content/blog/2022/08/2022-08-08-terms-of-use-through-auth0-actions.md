---
id: 8a4122e0-173a-11ed-8621-2db27f7a922e
title: Terms of use through Auth0 Actions
date: 2022-08-08T17:07:43.975Z
cover: /assets/posts/blog-28-terms-of-use-through-auth0-actions.png
description: Require users to accept custom privacy policies during the login
  flow on Auth0. Don't know how? Let's see one solution for this through
  Redirect With Actions!
tags:
  - auth0
  - django
  - jwt
---
Suppose you want something from your user during the authentication flow. For example, let's say you want your user to accept new terms of use of your company or ask him something before he proceeds to the product's page. Auth0 allows you to do that using [Redirect With Actions](https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/redirect-with-actions). [It provides an attractive solution with Arengu](https://marketplace.auth0.com/integrations/arengu-policy-acceptance-actions), a low-code platform, but how can we use *redirect with actions* using our own solution?

## What you need to know before going forward

If you run [the project](https://github.com/willianantunes/tutorials/tree/master/2022/08/django-redirect-with-actions) I'm about to describe, you may see it as too magical. Thus I recommend the following articles I published on my blog to understand it more:

* [Getting to know Auth0 Deploy CLI with a practical scenario](https://www.willianantunes.com/blog/2022/02/getting-to-know-auth0-deploy-cli-with-a-practical-scenario/).
* [Add claims to JWT through Actions on Auth0](https://www.willianantunes.com/blog/2022/04/add-claims-to-jwt-through-actions-on-auth0/).

You'll comprehend how Auth0 Deploy CLI and Actions work.

## When the user is impacted and when he's not

Now, I had to come up with a business rule so we could have our sample project. Look at this image:

![It represents a diagram flow. The flow starts with a post-login trigger. Then, it evaluates if it's the first time the user authenticates. If that's the case, the user goes to the policy acceptance website; otherwise, he goes to the product XYZ website.](/assets/posts/blog-28-order-1-image-1-business-rule-actions-flow.png "Possible user flows during sign-up/sign-in.")

Depending on the user's state, we'll ask him something before he can proceed to the products page. Considering we ask the user and he goes ahead, our back-end solution is responsible for providing the data we'll use to refresh his [`app_metadata`](https://auth0.com/docs/manage-users/user-accounts/metadata#metadata-types). Download [this project](https://github.com/willianantunes/tutorials/tree/master/2022/08/django-redirect-with-actions) and see we have two folders:

* `auth0-infrastructure`**:** It holds everything you need to configure your [tenant](https://auth0.com/docs/get-started/auth0-overview/create-tenants#create-a-tenant-and-domain).
* `backend-django`**:** It represents the product; that is where the user goes after he authenticates. Also can be seen as the place where the user does the policy acceptance flow.

### Understanding the project `auth0-infrastructure`

It configures the Auth0 tenant for you, so you don't have to do it by hand. Moreover, it configures the Django project with the help of a [script](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/auth0-infrastructure/scripts/env_setter.py) and the [docker volume](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/docker-compose.yaml#L15-L16). The most important part here is the custom action configured during the [login and post-login flow](https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow#login-post-login).

#### The custom action policy acceptance verifier

See the content of `Policy acceptance verifier.json`:

```json
{
  "name": "Policy acceptance verifier",
  "code": "platform/actions/Policy acceptance verifier/code.js",
  "runtime": "node16",
  "status": "built",
  "dependencies": [],
  "secrets": [
    {
      "name": "THE_SECRET_USED_TO_CREATE_OPEN_AND_VALIDATE_THE_JWT",
      "value": "##THE_SECRET_USED_TO_CREATE_OPEN_AND_VALIDATE_THE_JWT##"
    },
    {
      "name": "BACKEND_DJANGO_ENDPOINT",
      "value": "##BACKEND_DJANGO_ENDPOINT##"
    }
  ],
  "supported_triggers": [
    {
      "id": "post-login",
      "version": "v2"
    }
  ],
  "deployed": true
}
```

It has two secrets. [One represents the endpoint of the terms acceptance page](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/auth0-infrastructure/platform/actions/Policy%20acceptance%20verifier.json#L13-L14), and [the other is the secret we'll use to create a JWT](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/auth0-infrastructure/platform/actions/Policy%20acceptance%20verifier.json#L9-L10) so we can send it to our service. The JWT library uses the algorithm [HS256](https://auth0.com/blog/rs256-vs-hs256-whats-the-difference/#HS256-Signing-Algorithm) to encode and validate the token. This means we should use the same secret in our back-end service to validate the received token and send a custom token with enriched data. The code of the custom action has two handlers.

##### Handler `onExecutePostLogin`

This code is invoked immediately after the user's authentication.

```javascript
const termsKey = "termsAcceptanceHistory"

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in. {@link https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object|Public documentation}.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login. {@link https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object|Public documentation}.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Properties from the event
  const clientIdApplicationTheUserLoggingInTo = event.client.client_id
  const userProperties = event.user
  const currentUserAppMetadata = userProperties.app_metadata
  const currentUserId = userProperties.user_id
  const currentTimestamp = event?.authentication?.methods[0]["timestamp"] || new Date().toISOString()
  // Let's verify if it's the first time the user is logging in!
  // By the way, you could verify if a new policy acceptance flow in indeed required after new logins.
  const isFirstLogin = !currentUserAppMetadata.hasOwnProperty(termsKey)
  if (isFirstLogin) {
    // Craft a signed session token so we can send it to our backend
    const customClaims = {
      id: currentUserId,
      app_metadata: currentUserAppMetadata,
      client_id: clientIdApplicationTheUserLoggingInTo,
      whenTheEventStarted: currentTimestamp,
    }
    const tenMinutes = 60 * 10
    const token = api.redirect.encodeToken({
      secret: event.secrets.THE_SECRET_USED_TO_CREATE_OPEN_AND_VALIDATE_THE_JWT,
      expiresInSeconds: tenMinutes,
      payload: customClaims,
    })
    // Initializing policy acceptance flow
    api.redirect.sendUserTo(event.secrets.BACKEND_DJANGO_ENDPOINT, {
      query: { session_token: token },
    })
  }
}
```

We just check if this is the first time the user is signing in. If that's the case, we interrupt the normal login flow and redirect him to the policy acceptance website.

##### Handler `onContinuePostLogin`

It resumes the flow when the user goes back to Auth0. It understands it because of the `state` parameter. It sends this parameter to the policy acceptance website (look at it [here](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/backend-django/backend_django/apps/core/api/v1/api_views.py#L70)). Then, the website must send the same parameter back to make the flow work properly (see [this part](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/backend-django/backend_django/apps/core/views.py#L66)). Let's see the handler's code:

```javascript
const termsKey = "termsAcceptanceHistory"

/**
 * Handler that will be invoked when this action is resuming after an external redirect. If your
 * onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in. {@link https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object|Public documentation}.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login. {@link https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object|Public documentation}.
 */
exports.onContinuePostLogin = async (event, api) => {
  const queryStringWhereTheTokenIs = "data"
  const payload = api.redirect.validateToken({
    secret: event.secrets.THE_SECRET_USED_TO_CREATE_OPEN_AND_VALIDATE_THE_JWT,
    tokenParameterName: queryStringWhereTheTokenIs,
  })
  // Our backend will do the job for us, then we just need to update/create the claim
  api.user.setAppMetadata(termsKey, payload["other"][termsKey])
}
```

Also, for the article's sake, we just get the token's value and use it to configure the user's `app_metadata`.

### Understanding the project `backend-django`

This is a simple Django project. We are using the [Django template](https://docs.djangoproject.com/en/4.0/topics/templates/) to serve the [product XYZ](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/backend-django/backend_django/apps/core/views.py#L21-L34) and for the [policy acceptance page](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/backend-django/backend_django/apps/core/views.py#L43-L71). About the latter, the crucial part is where the flow starts, which is the view `handle_terms` function:

```python
@api_view(["GET"])
def handle_terms(request: Request) -> Response:
    _logger.debug("Received params: %s", request.query_params)

    _logger.debug("Extracting required params")
    session_token = request.query_params.get("session_token")
    state = request.query_params.get("state")

    _logger.debug("Decrypting the session token")
    payload: PayloadAuth0 = jwt.decode(session_token, settings.AUTH0_JWT_SECRET, algorithms=["HS256"])

    _logger.debug("Let's store the payload and the state so we can retrieve them later")
    request.session["state"] = state
    request.session["payload"] = payload

    return redirect(reverse("terms"))
```

Notice that Auth0 sends the query strings `session_token` and `state`. We store them to use later when the user finishes the flow on the policy acceptance page. This is the code responsible for rendering the page and handling the conclusion:

```python
def terms(request):
    if request.method == "POST":
        state = request.session["state"]
        payload_from_auth0 = request.session["payload"]
        payload = {
            "iat": timezone.now(),
            "sub": payload_from_auth0["sub"],
            "iss": settings.AUTH0_DOMAIN,
            "exp": timezone.now() + timedelta(seconds=30),
            "state": state,
            "other": {
                "termsAcceptanceHistory": [
                    {
                        "version": 1,
                        "registeredAt": timezone.now().isoformat(),
                    }
                ]
            },
        }
        jwt_to_be_set = jwt.encode(payload, settings.AUTH0_JWT_SECRET, algorithm="HS256")
        logger.debug("Created JWT: %s", jwt_to_be_set)
        params = {
            "state": state,
            "data": jwt_to_be_set,
        }
        return redirect(build_url_with_query_strings(AUTH0_CONTINUE_ENDPOINT, params))

    return render(request, "core/pages/terms.html")
```

We retrieve the `session_token` and `state` parameters and use them to terminate the flow, sending the user to Auth0 again (this is where the handler `onContinuePostLogin` takes place). By the way, the [payload](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/backend-django/backend_django/apps/core/views.py#L47-L61) is crucial here. If you miss any required claim, for instance, `exp`, Auth0 will return a weird error: it won't tell you where the error precisely is. So instead, it gives you a [generic error](https://community.auth0.com/t/post-login-action-cant-get-passback-jwt-validated-the-session-token-is-invalid-missing-or-invalid-standard-claims/69127?u=willianantunes).

## Running the entire solution

You must replace the following environment variables before running the compose service:

* `AUTH0_DOMAIN`: Provide your tenant's domain.
* `AUTH0_CLIENT_ID`: The client ID representing the M2M application that can configure your tenant.
* `AUTH0_CLIENT_SECRET`: The client secret representing the M2M application that can configure your tenant.
* `BACKEND_DJANGO_ENDPOINT`: [The comment](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/docker-compose.yaml#L13) has a sample configuration with [ngrok](https://ngrok.com/). If you use another provider to expose your service to the internet, just don't change the request path; otherwise, it won't work.

Giving everything is fine, you can execute the command:

```shell
docker-compose up update-settings
```

You'll see something close to this output:

```shell
update-settings_1  | > auth0-infrastructure@ deploy:sandbox /app
update-settings_1  | > a0deploy import --config_file ./configs/sandbox.json --input_file ./platform --debug
update-settings_1  | 
update-settings_1  | 2022-08-07T15:48:19.959Z - debug: Start command import
update-settings_1  | 2022-08-07T15:48:20.709Z - info: Processing directory ./platform
update-settings_1  | 2022-08-07T15:48:20.739Z - info: Getting access token for Y7VjObONjhI1TKYafmun0mAbAo6NR4ty/COCKATIEL.us.auth0.com
update-settings_1  | 2022-08-07T15:48:24.458Z - debug: Start processChanges for rulesConfigs [delete:0] [update:0], [create:0], [conflicts:0]
update-settings_1  | 2022-08-07T15:48:24.459Z - debug: Start processChanges for resourceServers [delete:0] [update:0], [create:0], [conflicts:0]
update-settings_1  | 2022-08-07T15:48:25.171Z - debug: Start processChanges for clients [delete:0] [update:1], [create:0], [conflicts:0]
update-settings_1  | 2022-08-07T15:48:25.173Z - debug: Stripping "Product XYZ" read-only fields ["jwt_configuration.secret_encoded","client_id"]
update-settings_1  | 2022-08-07T15:48:25.885Z - info: Updated [clients]: {"name":"Product XYZ","client_id":"IKHOAnUg2TUAd98LRwLVSqZ5RtA5cwLb"}
update-settings_1  | 2022-08-07T15:48:27.521Z - debug: Start processChanges for databases [delete:0] [update:1], [create:0], [conflicts:0]
update-settings_1  | 2022-08-07T15:48:27.522Z - debug: Stripping "" read-only fields ["strategy","name","id"]
update-settings_1  | 2022-08-07T15:48:29.164Z - info: Updated [databases]: {"name":"Username-Password-Authentication","id":"con_ZEolng7w3KpzfWwZ"}
update-settings_1  | 2022-08-07T15:48:29.704Z - debug: Start processChanges for actions [delete:0] [update:1], [create:0], [conflicts:0]
update-settings_1  | 2022-08-07T15:48:29.706Z - debug: Stripping "Policy acceptance verifier" read-only fields ["deployed","status","id"]
update-settings_1  | 2022-08-07T15:48:30.287Z - info: Updated [actions]: {"id":"8f468bb3-97cd-49e4-949f-4528b5a34e37","name":"Policy acceptance verifier"}
update-settings_1  | 2022-08-07T15:48:31.311Z - info: Deployed [actions]: {"id":"8f468bb3-97cd-49e4-949f-4528b5a34e37","name":"Policy acceptance verifier"}
update-settings_1  | 2022-08-07T15:48:31.986Z - info: Updated [triggers]: {"trigger_id":"post-login"}
update-settings_1  | 2022-08-07T15:48:32.753Z - info: Updated [tenant]: {"enabled_locales":["en"],"flags":{"universal_login":true,"revoke_refresh_token_grant":false,"disable_clickjack_protection_headers":false},"friendly_name":"Cockatiel SANDBOX","picture_url":"https://www.willianantunes.com/favicon.ico","support_email":"iago@agrabah.disney.com","support_url":"https://github.com/willianantunes/tutorials"}
update-settings_1  | 2022-08-07T15:48:32.754Z - info: Import Successful
update-settings_1  | 2022-08-07T15:48:32.755Z - debug: Finished command import
update-settings_1  | Getting all env files
update-settings_1  | Creating Auth0 Management API Client
update-settings_1  | Gathering needed data
update-settings_1  | Applying configuration
update-settings_1  | Done 🥳
django-redirect-with-actions_update-settings_1 exited with code 0
```

The script updates the file [`.env.development`](https://github.com/willianantunes/tutorials/blob/ca442fbf94a7ac4ae50b77a6eba89dc96b79f0bb/2022/08/django-redirect-with-actions/backend-django/.env.development#L16-L18) with the required data. Now we can run the web application:

```shell
docker-compose up app
```

Access the address `http://app.local:8010/` and see it in action:

`youtube: https://youtu.be/ki3j1WgvJjs`

If you want to see the terms page again, don't forget to erase the user's `app_metadata`.

## Conclusion

Redirect with actions can come in handy when you require additional steps for your user. For example, you can ask users to provide additional verification when logging in from unknown locations to illustrate something different from what we did in this article.

The overall technical aspect of the whole solution is relatively simple. You should pay some attention in terms of security, though.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/08/django-redirect-with-actions).

Posted listening to [Manhattan, Eric Johnson](https://youtu.be/Gc-AAjcvzEA) 🎶.
