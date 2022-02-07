---
id: 634ef590-87a7-11ec-9f31-b93de9ae46d4
title: Getting to know Auth0 Deploy CLI with a practical scenario
date: 2022-02-07T00:02:27.474Z
cover: /assets/posts/blog-16-getting-to-know-auth0-deploy-cli-with-a-practical-scenario.png
description: Don't manage your Auth0 tenant directly through the console.
  Instead, do it through Auth0 Deploy CLI with ease!
tags:
  - auth0
  - devops
---
Auth0 is a fascinating identity solution. Not only because it's straightforward in terms of putting your application up and running with authentication, but because it has a variety of tools that assist you in many aspects during the development. For instance, you have many [libraries](https://auth0.com/docs/libraries) you can use in your application. Another great tool they've made is the [Auth0 Deploy CLI](https://github.com/auth0/auth0-deploy-cli/). You can manage your [tenant](https://auth0.com/docs/videos/get-started-series/architect-your-tenant) through manifests and then use this tool to deploy them. By the way, it's worth mentioning [Terraform is supported in some sense](https://auth0.com/blog/use-terraform-to-manage-your-auth0-configuration/), although [Auth0 still recommends using Auth0 Deploy CLI](https://auth0.com/docs/deploy-monitor/deployment-best-practices#use-deploy-cli-tool-for-rule-import-and-export) in its deployment best practices documentation. Let's see a practical scenario where we can use this tool in action.

## Describing the scenario

The overall idea is quite simple. First, we'll have a [SPA](https://en.wikipedia.org/wiki/Single-page_application) that redirects the user when authentication is required. Then the universal login shows three options:

* Database login using email and password.
* Login as Google.
* Login as Facebook.

Given a success, either for sign up or log in, the user goes back to the application where the flow started. Here's the image of our scenario:

![This scenario shows 5 steps. The first start with the authorization code grant type, then the tenant shows login options, followed by the user authentication. and then ending with the tokens (id_token and access_token).](/assets/posts/blog-16-order-1-image-1-scenario.png "Proposed scenario")

## Requirement: Deploy CLI Application

The Auth0 Deploy CLI uses `client_id` and `client_secret` to manage resources through the Management API. So, just follow [this article](https://auth0.com/docs/deploy-monitor/deploy-cli-tool/create-and-configure-the-deploy-cli-application) that describes how you can configure it manually on Auth0 Console.

After that, you can create a new NPM package with `npm init` and install `auth0-deploy-cli`. Now you can move on 😆.

## Use a tenant sandbox

I think this is a must-have. To configure a production tenant, first, you should do it through another tenant responsible for templating manifests. This is supposed to be used only for development purposes. Here's the suggested flow when working with Auth0 Deploy CLI:

* Your sandbox tenant is a copy of the production one.
* You change the tenant configuration using its Management API or *Auth0 Web Console*.
* When everything seems fine, you export/dump the tenant's setup.
* You copy the generated manifests and then past them in your repository.
* Somebody checks if everything is fine.
* When the code is in the main branch, the deployment is triggered.

So, if you had the following tenants:

* cockatiel-sandbox-dev1.
* cockatiel-agrabah-prd.

You'd test things in the sandbox tenant, then export the configuration from it and apply the manifests in the production tenant.

This article will use just a single tenant to be more forthright.

### Exporting configuration

You have two options to export the configuration: [YAML](https://auth0.com/docs/deploy-monitor/deploy-cli-tool/import-export-tenant-configuration-to-yaml-file) or [directory](https://auth0.com/docs/deploy-monitor/deploy-cli-tool/import-export-tenant-configuration-to-directory-structure). When I looked at their limitations and [some issues](https://github.com/auth0/auth0-deploy-cli/issues) in the project's repository, I preferred the directory approach rather than YAML, which seems to lack many features. However, as Auth0 documentation is not versioned, I suggest you look at it again if anything has changed.

You can insert a custom script to export your configuration in the project's `package.json`:

```json
{
  "name": "getting-to-know-auth0-deploy-cli",
  "private": true,
  "scripts": {
    "dump:sandbox": "a0deploy export --config_file ./configs/sandbox.json --format directory --output_folder ./exported/platform"
  },
  "dependencies": {
    "auth0-deploy-cli": "^7.3.2"
  }
}
```

How is our `sandbox.json`:

```json
{
  "AUTH0_DOMAIN": "YOUR-TENANT.us.auth0.com",
  "AUTH0_CLIENT_ID": "YOUR_CLIENT_ID",
  "AUTH0_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
  "AUTH0_ALLOW_DELETE": true,
  "EXCLUDED_PROPS": {
    "clients": [
      "client_secret"
    ],
    "connections": [
      "options.client_secret"
    ]
  }
}
```

Replacing with your's tenant details, if you execute the script, you'd have the following structure in your project, given your tenant was really empty:

```shellsession
▶ tree --dirsfirst -I node_modules .        
.
├── configs
│   └── sandbox.json
├── exported
│   └── platform
│       ├── clients
│       │   ├── Default App.json
│       │   └── Tenant management - M2M - getting-to-know-auth0-deploy-cli.json
│       ├── connections
│       │   └── google-oauth2.json
│       ├── database-connections
│       │   └── Username-Password-Authentication
│       │       └── database.json
│       ├── emails
│       │   └── provider.json
│       ├── grants
│       ├── guardian
│       │   ├── factors
│       │   │   ├── duo.json
│       │   │   ├── email.json
│       │   │   ├── otp.json
│       │   │   ├── push-notification.json
│       │   │   ├── recovery-code.json
│       │   │   ├── sms.json
│       │   │   ├── webauthn-platform.json
│       │   │   └── webauthn-roaming.json
│       │   ├── providers
│       │   ├── templates
│       │   ├── phoneFactorMessageTypes.json
│       │   ├── phoneFactorSelectedProvider.json
│       │   └── policies.json
│       ├── organizations
│       ├── pages
│       ├── resource-servers
│       ├── roles
│       ├── rules
│       ├── triggers
│       │   └── triggers.json
│       └── tenant.json
├── package.json
└── package-lock.json
```

### Inserting placeholders

Opening the file `tenant.json`, you have the following:

```json
{
  "enabled_locales": [
    "en"
  ],
  "flags": {
    "universal_login": true,
    "revoke_refresh_token_grant": false,
    "disable_clickjack_protection_headers": false
  }
}
```

There are other properties such as `friendly_name`, `picture_url`, `support_email`, `support_url`, [among others](https://auth0.com/docs/api/management/v2#!/Tenants/patch_settings). If you change them on *Auth0 Web Console* and export the configuration again, you'd have the following:

```json
{
  "enabled_locales": [
    "pt-BR"
  ],
  "flags": {
    "universal_login": true,
    "revoke_refresh_token_grant": false,
    "disable_clickjack_protection_headers": false
  },
  "friendly_name": "Cockatiel SANDBOX",
  "picture_url": "https://www.willianantunes.com/favicon.ico",
  "support_email": "iago@agrabah.disney.com",
  "support_url": "https://github.com/willianantunes/tutorials"
}
```

This is good, but the values are hard-coded. To avoid this, the tool allows you to create placeholders in the JSON files; then, they are replaced in memory during runtime. Therefore, the key [`AUTH0_KEYWORD_REPLACE_MAPPINGS`](https://auth0.com/docs/deploy-monitor/deploy-cli-tool/environment-variables-and-keyword-mappings) is needed in our `config.json`:

```json
{
  "AUTH0_DOMAIN": "YOUR-TENANT.us.auth0.com",
  "AUTH0_CLIENT_ID": "YOUR_CLIENT_ID",
  "AUTH0_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
  "AUTH0_ALLOW_DELETE": true,
  "EXCLUDED_PROPS": {
    "clients": [
      "client_secret"
    ],
    "connections": [
      "options.client_secret"
    ]
  },
  "AUTH0_KEYWORD_REPLACE_MAPPINGS": {
    "TENANT_NAME": "Cockatiel SANDBOX",
    "TENANT_PICTURE_URL": "https://www.willianantunes.com/favicon.ico",
    "TENANT_SUPPORT_EMAIL": "iago@agrabah.disney.com",
    "TENANT_SUPPORT_URL": "https://github.com/willianantunes/tutorials"
  }
}
```

Now the `tenant.json`:

```json
{
  "enabled_locales": [
    "en"
  ],
  "flags": {
    "universal_login": true,
    "revoke_refresh_token_grant": false,
    "disable_clickjack_protection_headers": false
  },
  "friendly_name": "##TENANT_NAME##",
  "picture_url": "##TENANT_PICTURE_URL##",
  "support_email": "##TENANT_SUPPORT_EMAIL##",
  "support_url": "##TENANT_SUPPORT_URL##"
}
```

### Importing configuration

To validate the configuration we did above, we can import/deploy the configuration. To do so, first, copy the `exported/platform` folder to `platform`. This idea is to make sure we don't override the configuration when it's exported it in the future. Then update the `package.json`:

```json
{
  "name": "getting-to-know-auth0-deploy-cli",
  "private": true,
  "scripts": {
    "dump:sandbox": "a0deploy export --config_file ./configs/sandbox.json --format directory --output_folder ./exported/platform",
    "deploy:sandbox": "a0deploy import --config_file ./configs/sandbox.json --input_file ./platform"
  },
  "dependencies": {
    "auth0-deploy-cli": "^7.3.2"
  }
}
```

If you run it, it should work just fine 😉.

```shellsession
▶ npm run deploy:sandbox

> getting-to-know-auth0-deploy-cli@ deploy:sandbox /home/willianantunes/Development/git-personal/tutorials/2022/02/getting-to-know-auth0-deploy-cli
> a0deploy import --config_file ./configs/sandbox.json --input_file ./platform

2022-02-06T21:58:10.039Z - info: Processing directory ./platform
2022-02-06T21:58:10.047Z - info: Getting access token for RR14XXXXXXTF9HJknxEVnSuQMn4SC3Q5/YOUR_SAND_BOX.us.auth0.com
{"name":"Tenant management - M2M - getting-to-know-auth0-deploy-cli","client_id":"RX14XcEKu0TF9HJknxEVnSuQMn4SC3Q5"}
2022-02-06T21:58:12.867Z - info: Updated [clients]: {"name":"Default App","client_id":"fSwd53K9BTuQZOVwX48wVsjevGiEHTFV"}
2022-02-06T21:58:13.167Z - info: Updated [guardianFactors]: {"name":"webauthn-platform"}
2022-02-06T21:58:13.184Z - info: Updated [guardianFactors]: {"name":"webauthn-roaming"}
2022-02-06T21:58:13.190Z - info: Updated [guardianFactors]: {"name":"recovery-code"}
2022-02-06T21:58:13.574Z - info: Updated [guardianFactors]: {"name":"duo"}
2022-02-06T21:58:13.595Z - info: Updated [guardianFactors]: {"name":"otp"}
2022-02-06T21:58:13.605Z - info: Updated [guardianFactors]: {"name":"sms"}
2022-02-06T21:58:13.631Z - info: Updated [guardianFactors]: {"name":"email"}
2022-02-06T21:58:13.636Z - info: Updated [guardianFactors]: {"name":"push-notification"}
2022-02-06T21:58:14.325Z - info: Updated [guardianPolicies]: {"policies":[]}
2022-02-06T21:58:15.079Z - info: Updated [guardianPhoneFactorSelectedProvider]: {"provider":"auth0"}
2022-02-06T21:58:15.771Z - info: Updated [guardianPhoneFactorMessageTypes]: {"message_types":[]}
2022-02-06T21:58:19.600Z - info: Updated [databases]: {"name":"Username-Password-Authentication","id":"con_aCrWwGU6XN1VstmV"}
2022-02-06T21:58:22.215Z - info: Updated [connections]: {"name":"google-oauth2","id":"con_ED6t0zYcK5Bt06qH"}
2022-02-06T21:58:25.870Z - info: Updated [tenant]: {"enabled_locales":["en"],"flags":{"universal_login":true,"revoke_refresh_token_grant":false,"disable_clickjack_protection_headers":false},"friendly_name":"Cockatiel SANDBOX","picture_url":"https://www.willianantunes.com/favicon.ico","support_email":"iago@agrabah.disney.com","support_url":"https://github.com/willianantunes/tutorials"}
2022-02-06T21:58:25.870Z - info: Import Successful
```

## Creating the SPA client and all the connections

I suggest you follow [this tutorial from Auth0](https://auth0.com/docs/get-started/auth0-overview/create-applications/single-page-web-apps) to the SPA client. When you are on *Auth0 Web Console*, in the **Application URIs**, configure all fields with `https://app.local:8002/`, less the field **Application Login URI**, which should be empty.

Google connection is already available through the file `google-oauth2.json`. You can create one configuration for [Facebook in Social Connections](https://marketplace.auth0.com/integrations/facebook-social-connection) on *Auth0 Web Console*. You do not need to provide any developer keys as [Auth0 provides theirs for you](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/devkeys) for testing purposes. 

Enable both connections (Google and Facebook) in the SPA client properties when you finish. You should see something link this:

![Two social connections are available: Google and Facebook. Both are active with Auth0 Dev Keys.](/assets/posts/blog-16-order-2-image-2-auth0-social-connections.png "Auth0 Web Console - Social Connections")

Now you can export the configuration! Finally, we can clean the list of `enabled_clients` and leave just our SPA client for every connection, including the database one. Using the *keyword replace mapping*, then that's what we have:

* `sandbox.json`

```json
{
  "AUTH0_DOMAIN": "YOUR-TENANT.us.auth0.com",
  "AUTH0_CLIENT_ID": "YOUR_CLIENT_ID",
  "AUTH0_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
  "AUTH0_ALLOW_DELETE": true,
  "EXCLUDED_PROPS": {
    "clients": [
      "client_secret"
    ],
    "connections": [
      "options.client_secret"
    ]
  },
  "AUTH0_KEYWORD_REPLACE_MAPPINGS": {
    "TENANT_NAME": "Cockatiel SANDBOX",
    "TENANT_PICTURE_URL": "https://www.willianantunes.com/favicon.ico",
    "TENANT_SUPPORT_EMAIL": "iago@agrabah.disney.com",
    "TENANT_SUPPORT_URL": "https://github.com/willianantunes/tutorials",
    "PRODUCT_XYZ_URI": [
      "https://app.local:8002/"
    ]
  }
}
```

* `Product XYZ.json`

```json
{
  "is_token_endpoint_ip_header_trusted": false,
  "name": "Product XYZ",
  "cross_origin_auth": false,
  "callbacks": @@PRODUCT_XYZ_URI@@,
  "allowed_logout_urls": @@PRODUCT_XYZ_URI@@,
  "is_first_party": true,
  "sso_disabled": false,
  "oidc_conformant": true,
  "refresh_token": {
    "expiration_type": "non-expiring",
    "leeway": 0,
    "infinite_token_lifetime": true,
    "infinite_idle_token_lifetime": true,
    "token_lifetime": 2592000,
    "idle_token_lifetime": 1296000,
    "rotation_type": "non-rotating"
  },
  "allowed_origins": @@PRODUCT_XYZ_URI@@,
  "jwt_configuration": {
    "alg": "RS256",
    "lifetime_in_seconds": 36000,
    "secret_encoded": false
  },
  "token_endpoint_auth_method": "none",
  "app_type": "spa",
  "grant_types": [
    "authorization_code",
    "implicit",
    "refresh_token"
  ],
  "web_origins": @@PRODUCT_XYZ_URI@@,
  "custom_login_page_on": true
}
```

* `facebook.json`

```json
{
  "options": {
    "email": true,
    "scope": "email,public_profile",
    "public_profile": true
  },
  "strategy": "facebook",
  "name": "facebook",
  "is_domain_connection": false,
  "enabled_clients": [
    "Product XYZ"
  ]
}
```

* `google-oauth2.json`

```json
{
  "options": {
    "email": true,
    "scope": [
      "email",
      "profile"
    ],
    "profile": true
  },
  "strategy": "google-oauth2",
  "name": "google-oauth2",
  "is_domain_connection": false,
  "enabled_clients": [
    "Product XYZ"
  ]
}
```

## Known limitations and important things to know

Just to point some:

* `AUTH0_ALLOW_DELETE` affects only deploy action. It will remove any existing resources that aren't present in the source. It does not delete if the folder is not available at all (directory approach). Settings are not deleted for missing or empty folders.
* All resources are identified by either their [**id** or **name**](https://github.com/auth0/auth0-deploy-cli/blob/99fe955c31e6d99c88c64a3992c610b9b7113395/src/tools/utils.js#L129). That means if you change the SPA client from **Product XYZ** to **Product ACME**, the tool then creates another client.
* You can see the Auth0 Deploy CLI's own client settings, but not its grants. [Learn more about it](https://github.com/auth0/auth0-deploy-cli/issues/132#issuecomment-504390820).
* Sadly the tool does not support [prompts](https://auth0.com/docs/customize/universal-login-pages/customize-login-text-prompts), which would be excellent for those who use the [New Universal Login](https://auth0.com/docs/authenticate/login/auth0-universal-login/new-experience).
* You can't update the New Universal Login with [liquid](https://github.com/Shopify/liquid) templates.
* [Custom domains](https://auth0.com/docs/customize/custom-domains) configuration is not supported.
* [Signing keys](https://auth0.com/docs/get-started/tenant-settings/signing-keys) are not supported, which would enable their [rotation](https://auth0.com/docs/get-started/tenant-settings/signing-keys/rotate-signing-keys).
* [Log streams](https://auth0.com/docs/customize/log-streams/custom-log-streams) are not supported also. This would allow you to create a configuration to send logs to Elasticsearch, for instance.

That means you should use Auth0 Deploy CLI and a custom script to handle what it lacks in resource management 🥲.

## What's next

My next blog post will be about Django Rest Framework. I'll use what we did here as a foundation to enable the whole thing I'll discuss in the following article. Stay tuned 🤟!

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/02/getting-to-know-auth0-deploy-cli).

Posted listening to [Zelda Ocarina of Time: Fairy Flying, by Super Guitar Bros](https://www.youtube.com/watch?v=NFw-FrYmAEw&t=141s) 🎶.
