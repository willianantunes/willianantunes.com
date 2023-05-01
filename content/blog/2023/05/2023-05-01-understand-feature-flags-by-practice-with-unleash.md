---
id: ac9a0380-e86c-11ed-9c21-19cfde1d5923
title: Understand Feature Flags by Practice with Unleash
date: 2023-05-01T22:08:16.846Z
cover: /assets/posts/blog-32-understand-feature-flags-by-practice-with-unleash.png
description: Learn to implement feature flags in Python and JavaScript projects
  using Unleash. Then, let's see how to optimize your software development
  process.
tags:
  - feature flags
  - django
  - nextjs
---
When you start a task, it could be part of something big (like an [epic](https://www.atlassian.com/agile/project-management/epics-stories-themes)) that will only be fully deployed after some weeks or months. So instead of delivering a massive pull request with many files to review, you can put your code to be reviewed progressively without disrupting existing services. This can be done by using feature flags. Shipping fast is vital, though care with stability and quality is also critical.

## Feature flags typically are literally IF conditionals in your code

We are talking about IF-ELSE statements in your code. Let's see a real example. It enables a `ModelViewSet` ([check it on the DRF website](https://www.django-rest-framework.org/api-guide/viewsets/#modelviewset)) to only proceed with the request if the feature `ENABLE_PROFILE_API` is enabled:

```python
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "sex", "mail"]

    def initial(self, request, *args, **kwargs):
        """
        https://www.django-rest-framework.org/api-guide/views/#initialself-request-args-kwargs
        """
        enable_profile_api = client.is_enabled("ENABLE_PROFILE_API")
        if not enable_profile_api:
            raise Http404("Not available")
        super().initial(request, *args, **kwargs)
```

The sample feature flag above is provided by a client. Still, you can retrieve it from an environment variable or your database, considering more straightforward solutions.

Usually, that's what you'll see from a feature flag, but you can also use more sophisticated flags. For example, instead of storing boolean values, they can also store strings. You can also configure to activate them based on who is accessing your service. Of course, these and other features depend on your approach. Let's see some of them.

## Possible approaches

Let's see some techniques, their advantages, and drawbacks:

* **Environment variables:** Using Kubernetes, you can apply env variables through [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/) or [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/). The problem with it, though, is how they are applied. A new deployment is necessary every time you update them. It's a decentralized solution. If two different applications use the same flag name, both will need a deployment. Imagine you find a bug after the deployment; you'll have to wait until the new deployment occurs, so the service can be healthy again.
* **Database**: If your application has a database, you can create a table that stores the toggles. A new database query is necessary for every business flow that requires toggle evaluation. This approach is not a problem, but this method limits the feature flag for backend applications. It's also a decentralized solution. The main benefit of this process is that it does not require a new deployment.
* **Centralized solution:** You develop your own feature toggle management service. But that famous question appears: Why reinvent the wheel?

Talking about a centralized solution, have you ever heard of [Unleash](https://docs.getunleash.io/tutorials/unleash-overview)?

## Unleash

It has excellent documentation explaining how it works, how is its architecture options, pricing, and many other things. The primary reason I've chosen it to comprehend a centralized solution it's because [it is open-source](https://github.com/Unleash/unleash). Let's explore how it works in a Python/Django project and a JavaScript/Next.js project. First of all, access [this folder](https://github.com/willianantunes/tutorials/tree/master/2023/04/feature_toggle_unleash) and execute the command:

```shellsession
docker-compose up
```

When everything is up, access the page `http://localhost:4242/` and use the credential `admin:unleash4all`. Next, click on the project `default`.

![Unleash administration page listing all projects, but showing only the one named default.](/assets/posts/blog-32-asset-1-unleash-select-default-project.png "Project on Unleash.")

On its upper right, click on the import button.

![Unleash administration panel showing the details of the project named default. The arrow points to an icon that represents the IMPORT FILE method.](/assets/posts/blog-32-asset-2-unleash-upload-json.png "Project details.")

A panel will appear. Click on `select file` and then use `2023-04-29T21_20_20.516Z-export.json` from the `iac` folder. 

![Unleash import file panel. An arrow emphasizes where you can click to upload an image.](/assets/posts/blog-32-asset-3-unleash-select-file-to-upload.png "Unleash import file panel.")

Just follow the wizard until you conclude the import process. Then, you'll see 9 feature toggles:

![List of all registered feature toggles, with a total of 9.7 are activate, and 2 are deactivated.](/assets/posts/blog-32-asset-4-result-upload.png "List of feature toggles.")

### Python/Django project

Access the address `http://localhost:8000/`, and you **may** see this:

![Django landing page. It says "hello there" and shows a list of mocked profiles.](/assets/posts/blog-32-asset-5-access-django-localhost.png "Django landing page.")

I said **may** because if you press F5, you can see some variations. For example, check out what happened in my case:

![Django landing page including red ellipses showing where the toggles are playing a role.](/assets/posts/blog-32-asset-6-local-changed-by-flags.png "Django landing page.")

If you access the project `default` on Unleash, you'll see the column `seen` with values.

![A list with 4 toggles. It shows the first column with a green mark. It informs when the toggle was last consulted.](/assets/posts/blog-32-asset-7-toggles-seen-updated.png "List of toggles.")

By the way, each F5 may change how you see the website. If you want to persist the configuration, you can use [stickiness](https://docs.getunleash.io/reference/stickiness). 

#### Changing stickiness

Click on the feature toggle `PROFILE_MANAGEMENT_BUTTON_SCHEME` and then click on the tab variants ([click here for a shortcut](http://localhost:4242/projects/default/features/PROFILE_MANAGEMENT_BUTTON_SCHEME/variants)). Next, click on `edit variants`.

![The tab called "variants" of a particular toggle. It shows the details of the current stickiness configuration. It also shows where you can click to edit the variants.](/assets/posts/blog-32-asset-8-edit-toggle-variant.png "Variants details.")

Go to the bottom of the page. Change the stickiness option from random to default. We'll see a consistent experiment if you press F5 on the page. 

![List of all stickiness options available, it shows default, userId, sessionId, and random.](/assets/posts/blog-32-asset-9-types-stickiness.png "Stickiness options.")

When the change is committed and available for use (it takes 5 or 10 seconds), if you press F5 many times, you'll see the text is sometimes changing, not the button scheme anymore.

#### Feature toggle that stores JSON

The feature flag `TEXT_PRESENTATION` is not a classic ON/OFF. Actually, it stores a JSON.

![The details of an particular feature toggle that stores a JSON instead of a simple ON/OFF value.](/assets/posts/blog-32-asset-10-toggle-json.png "JSON feature toggle.")

[To get it from the client](https://github.com/willianantunes/tutorials/blob/420b8ee22a883cc324785fafcbacb5c6db58cdb8/2023/04/feature_toggle_unleash/app-python-django/app_python_django/apps/core/views.py#L35-L47):

```python
    logger.info("Using the button scheme %s with value %s", button_scheme_name, button_scheme_value)
    text_presentation = client.get_variant("TEXT_PRESENTATION", context=user_context)
    if text_presentation["enabled"]:
        text_presentation_name = text_presentation["name"]
        text_presentation_value = json.loads(text_presentation["payload"]["value"])
    else:
        text_presentation_name = "FALLBACK"
        text_presentation_value = {
            "title": "Hello there 😄!",
            "subTitle": "Change how this app behave by changing the feature toggle tool ⚒",
            "profileTitle": "Registered profiles",
        }
    logger.info("Using the text presentation %s with value %s", text_presentation_name, text_presentation_value)
```

#### Feature toggle for specific users

Access the toggle `GAME_SHARK_MODE` and look at its deployment strategy:

![It shows the details of the GAME_SHARK_MODE toggle, focusing on the current deployment strategy for the development environment.](/assets/posts/blog-32-asset-11-toggle-deployment-strategy.png "Deployment strategy based on userId.")

It's a dedicated toggle only ON if the user has the ID `d821cbc0-2e4d-49fc-a5b4-990eb991beec`. To configure a user ID, we do [this](https://github.com/willianantunes/tutorials/blob/420b8ee22a883cc324785fafcbacb5c6db58cdb8/2023/04/feature_toggle_unleash/app-python-django/app_python_django/apps/core/views.py#L15-L22) on the backend side:

```python
def index(request):
    user_id_pc = "40956364-e486-4d8e-b35e-60660721f467"
    user_id_mobile = "d821cbc0-2e4d-49fc-a5b4-990eb991beec"
    user_id = user_id_pc if request.user_agent.is_pc else user_id_mobile
    user_context = {
        "userId": user_id,
        # Browser family can be `chrome` or `firefox`
        "browser": request.user_agent.browser.family.lower(),
    }
    # ...
    game_shark_mode = client.is_enabled("GAME_SHARK_MODE", context=user_context)
```

If you change the access mode to a mobile one, then you'll see a new behavior:

![The images illustrates what would happen if you access the Django landing page from a mobile phone. It forces the activation of the toggle GAME_SHARK_MODE.](/assets/posts/blog-32-asset-12-gamesharkmode.png "Toggle behavior when mobile.")

There are many [activation strategies](https://docs.getunleash.io/reference/activation-strategies) that you can test:

![A list of all activation strategies available. It shows standard, gradual rollout, userIds, and IPs.](/assets/posts/blog-32-asset-13-types-activation-deployments.png "Types of activation strategies.")

### JavaScript/Next.js project

It's the same project as the Python one regarding behavior, but using another SDK and not including some toggles, such as `ENABLE_PROFILE_API` and `ENABLE_PROFILE_ADMIN`. Try it yourself 😄.

### What if the centralized server is off?

You can circumvent an outage of the feature management server by doing two things in the case you're using Unleash:

* **Unleash Edge**: It sits between the Unleash API and your SDKs and provides a cached read-replica of your Unleash instance. Currently, it has modes edge and offline. [I recommend looking at its docs](https://docs.getunleash.io/reference/unleash-edge).
* **Client-side cache:** Unleash has an [extensive list of client SDKs](https://docs.getunleash.io/reference/sdks); it seems all have cache strategies. For instance, the [JavaScript browser SDK](https://github.com/Unleash/unleash-proxy-client-js) offers the option [bootstrap](https://github.com/Unleash/unleash-proxy-client-js/blob/5a75ec4fd165c26427663141a7a160b922883065/README.md?plain=1#L250-L253). That means you can download all your configuration from a CDN and use it while your edge or central server is off.

![The image illustrates three components: your SDK client, Unleash Edge, and Unleash Server. It shows a possible solution with a CDN where both Unleash components are off.](/assets/posts/blog-32-asset-14-sdk-client-cdn.png "Cache via CDN.")

## Conclusion

A feature flag is necessary if you want to take a step forward for frequent releases. It comes with some impacts, though. Now you have to do more tests to check how a particular business rule behaves if a toggle XYZ and ACME are activated or how it acts if only toggle XYZ is activated, for example. This means your tests are more expensive now. Beyond that, a feature toggle governance is also required. What if a team left behind a toggle that should have been removed? There are types of toggles; one may be of type permission (no expected lifetime), and the other may be of type experiment (expected lifetime of 40 days). Well, it's a game of tradeoffs.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2023/04/feature_toggle_unleash).

Posted listening to [All Apologies, Nirvana](https://youtu.be/aWmkuH1k7uA) 🎶.
