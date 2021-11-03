---
id: d35c6b10-3cb1-11ec-a3e4-abdce293b596
title: SSO with Cognito through the Authorization Code grant type
date: 2021-11-03T18:18:28.993Z
cover: /assets/posts/blog-11-sso-with-cognito-through-the-authorization-code-grant-type.png
description: Understand once and for all what is an SSO experience with a
  practical project built from scratch using the Authorization Code grant type.
tags:
  - oauth
  - oidc
  - cognito
  - ciam
  - functional testing
---
Currently, I'm working for a company with a very particular problem that showed up after it created many products in different domains. It even bought some companies, making the problem worse: user who has an account on product A can't use the same account on product B. The following image illustrates this situation:

![If an organization has 5 products without unified login, the user has to keep 5 credentials to log in to each one, even though he is in the same ecosystem.](/assets/posts/blog-11-order-1-image-1-the-situation.png "Login has to keep 5 credentials for each application.")

Nowadays, each product has a specific way to authenticate and authorize a person. Now the company wants to unify all the accounts to use only one credential instead of many. How to achieve this 🤔?

## One possible way to unify accounts

To simplify the solution I'd like to present you, let's make some assumptions:

1. Every product has its way of authorizing the user.
2. Each product has a single database line that represents the user on its entire ecosystem.
3. To reference the user in other systems, it uses a UUID. Imagine that it could use a government ID or an email 🤯; for our lucky in our example, it doesn't 🥳.
4. The authentication flow only uses an email and password for all products.

Now that the scenario is more manageable, here's the proposed solution:

![When the user wants to log in on Product A, it goes to another domain, then when he authenticates or registers in there, he's redirected to where he was (Product A). However, if he goes to Product B, he's automatically authenticated, then experiencing an SSO (single sign-on).](/assets/posts/blog-11-order-2-image-2-proposed-solution.png "How the unified login works with SSO (single sign-on) experience")

Compiling the main points:

* **One single place for login and signup:** The user will experience the same flow for login and registration. Same UX, same rules, less confusion.
* **Given that the user is authenticated, if he goes from product A to B, he does not need to log in again (it depends):** Using a single domain to handle it makes this feature possible (the so-called SSO) as the session will be kept in one single place. For example, suppose products A and B are in the same domain as the Authorization Server. In that case, the user will be automatically authenticated on product B as it will know it through a cookie created by the Authorization Server. On the other hand, if product B is in another domain, the user will have to press a button to product B to receive his credentials.
* **The Authorization Server will not ask for user consent for first-party applications:** [First-party applications](https://auth0.com/docs/configure/applications/confidential-public-apps/first-party-and-third-party-applications#first-party-applications) are controlled by the same organization or person who owns the Authorization Server. [Third-party applications](https://auth0.com/docs/configure/applications/confidential-public-apps/first-party-and-third-party-applications#third-party-applications) enable external parties or partners to securely access protected resources given user consent. Usually, all applications you create that use some grant type (like Authorization Code) will be first-party. Though you can generate third-party ones for your partners to consume APIs from you.
* **Each product has to bind the unique ID associated with the user to its own way of authorizing him:** As I described above, any product has a database line to identify the user. The product will be responsible for creating a new line for him in its domain for new accounts. For existing users, it can check if the user who came from the Authorization Server has precisely the same email in its database or simply migrate all users upfront, in case it's feasible as [it depends](https://community.auth0.com/t/importing-users-from-365-azure-ad/34885/2) on which scenario you are in.

To illustrate the proposed solution in some parts, we'll go with [Cognito](https://aws.amazon.com/cognito/)! By the way, keep in mind that [Cognito has many limitations](https://github.com/willianantunes/cognito-auth-playground/tree/4532535582c3dbfe1f2ddaf0051f66efb2bef052#terrible-things-i-noticed), and I'm just using it for the sake of this blog post.

## Deploying Cognito as our Authorization Server through Terraform

To serve the first bullet of the main points of our proposed solution, we will use the [Cognito Hosted UI](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html) as our [Authorization Server](https://developer.okta.com/docs/concepts/auth-servers/#what-is-an-authorization-server). [Download the tutorial repository](https://github.com/willianantunes/tutorials) and access [the folder related to this blog post](https://github.com/willianantunes/tutorials/tree/master/2021/11/sso-cognito-authorization-code-grant-type). Now go to `cognito_iac` and then type `terraform apply`. Confirm and then wait until it's finished. You may see an error in case the domain has been already used by someone else:

![Cognito works like S3: The domain you configure for it must be unique in the entire cloud. If you use someone that has already been used, you as asked to pick another.](/assets/posts/blog-11-order-3-image-3-iac-possible-error.png "Error when you use an unavailable domain on Cognito.")

Just change to another name and try again until it works.

## Emulating products A and B

We'll emulate products A and B, but for that, we'll need to identify them on Cognito through [App Clients](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html). They were already created by our [IaC](https://en.wikipedia.org/wiki/Infrastructure_as_code). So let's look at them through AWS Console:

![When an application uses an Identity Provider, it uses through an App Client. The image shows 2 of them for products A and B.](/assets/posts/blog-11-order-4-image-4-cognito-app-clients.png "Two App Clients: 1 for product A and another for product B.")

Before running the products, you should execute the command below at the root folder to have each application properly configured with its app client credentials:

`youtube: https://www.youtube.com/watch?v=utdpJQ_qJ_8`

Now you can start them up!

```shellsession
▶ docker-compose up -d product-a product-b                           
Creating network "sso-cognito-authorization-code-grant-type_default" with the default driver
Creating sso-cognito-authorization-code-grant-type_product-b_1 ... done
Creating sso-cognito-authorization-code-grant-type_product-a_1 ... done
```

Product A can be accessed through `http://localhost:8000/`, and product B can be accessed through `http://localhost:8001/`. A small notice: actually, I would like to use `http://localhost:8000/` for product A and `http://app-local:8001/` for product B, but sadly [this is not supported by Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-idp-settings.html), which only accepts `localhost` for testing purposes.

### An important thing about the functional testing project

If you look at the project, you'll notice that I configured a reverse proxy to circumvent Cognito limitations about the callback URL I mentioned above. This configuration file basically does the following (remembering that I'm using [the hostname each service has inside Docker Compose](https://docs.docker.com/compose/networking/)) for the functional testing service:

* If you access `http://localhost:8000/`, you will be proxied with `http://product-a:8000/` instead.
* If you access `http://localhost:8001/`, you will be proxied with `http://product-b:8001/` instead.

```nginx
# Know more details here: https://stackoverflow.com/a/62712043/3899136

error_log /tmp/error.log;
pid       /tmp/nginx.pid;

events {
  # No special events for this simple setup
}

http {
  server {
    listen       8000;
    server_name  localhost;

    location / {
        proxy_pass  http://product-a:8000/;
    }

    # Set a number of log, temp and cache file options that will otherwise default to restricted locations accessible only to root.
    access_log /tmp/nginx_host.access.log;
    client_body_temp_path /tmp/client_body;
    fastcgi_temp_path /tmp/fastcgi_temp;
    proxy_temp_path /tmp/proxy_temp;
    scgi_temp_path /tmp/scgi_temp;
    uwsgi_temp_path /tmp/uwsgi_temp;
  }

    server {
    listen       8001;
    server_name  localhost;

    location / {
        proxy_pass  http://product-b:8001/;
    }

    # Set a number of log, temp and cache file options that will otherwise default to restricted locations accessible only to root.
    access_log /tmp/nginx_host.access.log;
    client_body_temp_path /tmp/client_body;
    fastcgi_temp_path /tmp/fastcgi_temp;
    proxy_temp_path /tmp/proxy_temp;
    scgi_temp_path /tmp/scgi_temp;
    uwsgi_temp_path /tmp/uwsgi_temp;
  }
}
```

Also, I had to include a workaround on the back-end side to change the hostname to localhost. 

```python
def _apply_gambiarra(uri):
    uri = uri.replace("product-a", "localhost")
    return uri.replace("product-b", "localhost")
```

Another noteworthy mention is about the screenshot folder. Follow [this instruction](https://github.com/willianantunes/tutorials/blob/ae1ee5975625c500f5a15508d43c1f8056c57aef/2021/11/sso-cognito-authorization-code-grant-type/docker-compose.yaml#L28-L31) if you'd like to see the images regarding each step executed by Selenium.

## Authorization Code Grant Type on product A

If you look at products A and B, you'll notice they are Django applications, and both are using Django Template Engine. Then they are Multi-Page Apps, not SPA ones. As I have a back-end to handle requests, I can use [the Authorization Code grant type](https://auth0.com/docs/authorization/flows/authorization-code-flow) to retrieve the token, but nowadays, this is perfectly fine using [this grant type with PKCE (Proof Key for Code Exchange) on the front-end side with SPA apps](https://auth0.com/docs/authorization/flows/authorization-code-flow-with-proof-key-for-code-exchange-pkce). Making this clear, now we can test this flow and see it in action! Run the command below:

```shellsession
▶ docker-compose up functional-testing               
Creating sso-cognito-authorization-code-grant-type_functional-testing_1 ... done
```

You would see something like this if executed through your IDE:

`youtube: https://www.youtube.com/watch?v=FGcABSdnHhg`

If you enable screenshots, you can open the folder `screenshots` and see the pictures of each step.

## SSO on product B

If you are logged on product A, that means you have something that identifies you as logged on in it (a cookie, for example). Still, if you go to product B, you won't be automatically logged because you are in another domain (in our case, you are in the localhost domain, but I changed how the session cookie is created for each application). Basically, this flow does the same we did previously, with the addition of the following steps:

* Go to product B.
* Click on the `Login Auth Code Flow` link.
* Go to the Cognito Hosted UI, and then return to product B as an authenticated user.

`youtube: https://www.youtube.com/watch?v=zVXsf0EfHIQ&feature=youtu.be`

It only works because Cognito creates a session cookie on its side when the user authenticates on its UI. So if you had logged off from there, you would have seen the login page on Cognito UI asking for your credentials again instead.

According to [Cognito Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html) with regards to Hosted UI session cookies:

> For access and ID tokens, don't specify a minimum of less than an hour. Amazon Cognito Hosted UI uses cookies that are valid for an hour; if you enter a minimum of less than an hour, you won't get a lower expiry time.

Supposing that we use the default one, which is 1 hour, the user will experience an SSO if he goes from product A to B within 1 hour. Otherwise, he'll have to log in again.

## Conclusion

The authorization code grant type is relatively easy, but don't underestimate it and other gran types you might face in an actual project, especially with topics that touch them, such as security issues. In addition, there are other points you should have in your mind when doing a project for an organization that obviously will go beyond what we discussed in this post:

* Do you need a [CIAM](https://en.wikipedia.org/wiki/Customer_identity_access_management) solution or an Internal User Access Management ([B2E](https://en.wikipedia.org/wiki/Business-to-employee) is a use case for the latter)?
* Each type of authentication typically creates a new record in the identity provider's database. You should have a rule in your mind to merge all accounts into a record that represents the main one. This is known as [account linking](https://auth0.com/docs/users/user-account-linking).
* Try to keep what identifies the user in your business in the Identity Provider. Do not mix what an application needs. If an application needs more data, it can go with [progressive profiling](https://auth0.com/docs/users/user-profiles/progressive-profiling).
* [Do not use OAuth 2.0 Implicit flow](https://developer.okta.com/blog/2019/05/01/is-the-oauth-implicit-flow-dead).
* [Do not use Resource Owner Password Credentials flow](https://auth0.com/docs/authorization/flows/avoid-common-issues-with-resource-owner-password-flow-and-attack-protection).
* [Avoid calling your API using the id_token](https://auth0.com/blog/id-token-access-token-what-is-the-difference/).
* Go with passwordless. [It's convenient for the user and more secure for your company](https://auth0.com/blog/what-is-passwordless-authentication/). 
* Know about the [FIDO Alliance](https://en.wikipedia.org/wiki/FIDO_Alliance).
* Do many benchmarks with many providers.
* Search for lessons learned. Gartner may give you valuable insights.

The scenario I described in this blog entry is not trivial. Usually, you'll need a good SDK (like [Amplify.JS](https://github.com/aws-amplify/amplify-js) or [Firebase](https://github.com/firebase/firebase-js-sdk)) and a simple provider, such as Cognito or [GCP Identity Platform](https://cloud.google.com/identity-platform), to store your users. Now, if you know that your company will need something more complex, don't hesitate to go with something more powerful and with fewer limitations.

Posted listening to [Everlong, Foo Fighters](https://youtu.be/eBG7P-K-r1Y) 🎶.
