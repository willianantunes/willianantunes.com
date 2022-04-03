---
id: 20bd9e60-a85f-11ec-b02d-254f3d4294b1
title: Caching JWKS using Redis with Django
date: 2022-03-20T15:05:06.677Z
cover: /assets/posts/blog-18-caching-jwks-using-redis-with-django.png
description: Stop consulting the JWKS endpoint all the time. Django has a really
  lovely cache abstraction that can handle it. Let's see how we can create a
  cache layer using Redis!
tags:
  - django
  - drf
  - auth0
  - jwt
  - redis
---
By the [end of the last article](https://www.willianantunes.com/blog/2022/03/validating-jwt-authentication-using-django-rest-framework/#next-steps-and-conclusion) about [Authentication with DRF](https://www.willianantunes.com/blog/2022/03/validating-jwt-authentication-using-django-rest-framework/), I described an issue we ran into: our application consults [the JWKS endpoint](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets) all the time to validate a JWT. The project I shared [here](https://github.com/willianantunes/tutorials/tree/master/2022/03/authentication-django-rest-framework) has this problem. [Django has a lovely cache abstraction](https://docs.djangoproject.com/en/4.0/topics/cache/), and recently, with version 4, it added [support for Redis](https://docs.djangoproject.com/en/4.0/topics/cache/#redis). So, to solve our problem, let's start configuring the development environment.

## Redis as compose service

This is how we'll configure [the compose file](https://docs.docker.com/compose/compose-file/):

```yaml
version: "3.9"

services:
  redis:
    image: redis:6.2.6-alpine
    command:
      [
        "redis-server",
        "--requirepass",
        "this-is-your-admin-password"
      ]
    ports:
      - "6379:6379"
```

If the service is ready to accept connections, you can use `redis-client` to test it:

```shellsession
docker-compose run redis redis-cli -h redis -p 6379 -a "this-is-your-admin-password"
```

If you type `ping`, you should receive `pong`:

```shellsession
redis:6379> PING
PONG
```

Learn more through [its documentation](https://redis.io/topics/rediscli).

## Discovering where PyJWT calls the JWKS endpoint

This discovery part is crucial. Knowing this, we can override the method responsible for this process, including the cache method in between.

Looking at [the constructor method of ***PyJWKClient***](https://github.com/jpadilla/pyjwt/blob/6a624f42112661d1e4ea43ce7a78a9d6c693644b/jwt/jwks_client.py#L12-L17), it does not call the JWKS endpoint. So, next, the client retrieves the `key_id` [during the authenticate method execution](https://github.com/willianantunes/tutorials/blob/28cff84a2dfe7b09d0bbb632a3ee3e2357740549/2022/03/authentication-django-rest-framework/authentication_django_rest_framework/apps/core/api/authentication/authentications.py#L43) through the method `get_signing_key_from_jwt`. This method eventually calls [`fetch_data`](https://github.com/jpadilla/pyjwt/blob/6a624f42112661d1e4ea43ce7a78a9d6c693644b/jwt/jwks_client.py#L19-L21), and this procedure requests the JWKS endpoint. Look at its implementation:

```python
def fetch_data(self) -> Any:
  with urllib.request.urlopen(self.uri) as response:
    return json.load(response)
```

## Adding a caching layer

We can create a class extending the `PyJWKClient` and override the `fetch_data` method. Then, using [the low-level cache API](https://docs.djangoproject.com/en/4.0/topics/cache/#the-low-level-cache-api) from Django, we can use the [`get_or_set`](https://docs.djangoproject.com/en/4.0/topics/cache/#django.core.caches.cache.get_or_set) to call the `fetch_data` only if the value isn't available in the cache. Translating this idea into code:

```python
class CachingJWKClient(PyJWKClient):
    cache_key = "MY_APP_NAME_JWKS"
    cache_timeout_1_day = 60 * 60 * 24

    def __init__(self, uri: str):
        super().__init__(uri)

    def fetch_data(self):
        return cache.get_or_set(self.cache_key, super().fetch_data, timeout=self.cache_timeout_1_day)
```

## Testing the custom PyJWKClient class

Testing what we coded is relatively straightforward. We should guarantee that upon calling the `fetch_data` method from our custom class many times, the actual `fetch_data` from the super is only called once:

```python
class TestJWKSCache:
    def test_should_use_cache_when_executing_fetch_data(self, mocker):
        # Arrange
        cache.delete("MY_APP_NAME_JWKS")
        url = "https://salted-url/.well-known/jwks.json"
        jwks_client = CachingJWKClient(url)
        fake_data = "salt-licker"
        mock_fetch_data = mocker.patch(
            "cache_django.apps.core.api.authentication.authentications.PyJWKClient.fetch_data"
        )
        mock_fetch_data.return_value = fake_data
        # Act
        assert jwks_client.fetch_data() == fake_data
        assert jwks_client.fetch_data() == fake_data
        assert jwks_client.fetch_data() == fake_data
        assert jwks_client.fetch_data() == fake_data
        # Assert
        assert mock_fetch_data.call_count == 1
```

We can guarantee the test behavior because we can patch the `fetch_data` method from the superclass 🤩.

## Next steps and conclusion

The Cache API from Django has many options that we didn't cover here. I strongly recommend reading [its guide](https://docs.djangoproject.com/en/4.0/topics/cache/#the-low-level-cache-api). By the way, from personal experience, I can tell you that caching is difficult and risky. So don't ever underestimate its great potential to make disorder in your system. Use it wisely and do tests to certify that everything will work as expected.

We are close to the point where we can talk about [APIView](https://www.django-rest-framework.org/api-guide/views/#class-based-views) and [OpenAPI Schema](https://www.django-rest-framework.org/api-guide/schemas/). We already have [a sample in the project](https://github.com/willianantunes/tutorials/blob/bf1825ee8ac8c4e8fa716c47603a5930dac62485/2022/03/cache-django/cache_django/apps/core/api/v1/views.py#L9-L17) about the former, though it's not even close to being production-ready. See you soon 🤟!

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/03/cache-django).

Posted listening to [Ocarina of Time Ambiance - Grottos - 10 Hours](https://youtu.be/OpfJQ_0_4qs) 🎶.
