---
id: 87bb1b30-9d9f-11ec-b280-1d91e9591bfd
title: "Validating JWT: Authentication using Django Rest Framework"
date: 2022-03-06T22:54:21.284Z
cover: /assets/posts/blog-17-validating-jwt-authentication-using-django-rest-framework.png
description: How to properly validate a JWT to accept an incoming request using
  Django Rest Framework if your API is a resource server? Get closer, and let's
  see it!
tags:
  - django
  - drf
  - auth0
  - jwt
---
In my last article, I described [how Auth0 Deploy CLI works with a practical example](https://www.willianantunes.com/blog/2022/02/getting-to-know-auth0-deploy-cli-with-a-practical-scenario/). Unfortunately, that example does not have a [resource server](https://auth0.com/docs/get-started/architecture-scenarios/server-application-api/part-1#client-credentials-grant). An essential factor appears when you need one: how to properly validate a JWT to accept an incoming request on your backend? [Auth0 explains what you need to do](https://auth0.com/docs/secure/tokens/access-tokens/validate-access-tokens), but how to achieve it using [Django Rest Framework](https://www.django-rest-framework.org/)?

## Where should JWT validation be implemented in DRF?

It doesn't matter which framework you are using; it's crucial to understand its API to configure your project without mistakes. DRF has an excellent API guide for this sole purpose:

![DRF has many topics about its API. In addition, its website has a dedicated menu about it.](/assets/posts/blog-17-order-1-image-1-api-guide-drf.png "DRF API Guide.")

So, where should JWT validation be implemented? A good hint is that we want to authenticate the JWT to guarantee it's a valid one. Another interesting tip is looking at other projects, and [Auth0 has many samples](https://github.com/auth0-samples). Our situation is quite evident because of this post's purpose: we will talk about [Authentication](https://www.django-rest-framework.org/api-guide/authentication/). But know this: every time you're feeling you're reinventing the wheel, maybe you're doing it the wrong way. If there is a framework, then someone has already solved your issue.

### Do not reinvent the wheel

The title describes what I do when creating a project from scratch. My focus should be on business code, not on infrastructure, let's say. This is even more true when using a mature framework such as Django. So, before coding anything, I try to find an open-source project to handle my problem. In this case, I tried to find one to handle the JWT validation. As I'm using Auth0 as the identity provider, only validation is required, nothing more. Searching, I encountered [DRF Simple JWT](https://github.com/jazzband/djangorestframework-simplejwt). It's fantastic, but unfortunately, it has [too many features](https://django-rest-framework-simplejwt.readthedocs.io/en/latest/index.html#contents). Exploring the project, I discovered an experimental feature called [JWTTokenUserAuthentication](https://django-rest-framework-simplejwt.readthedocs.io/en/latest/experimental_features.html) backend. It is an [Authentication mechanism](https://github.com/jazzband/djangorestframework-simplejwt/blob/72000af935da559e6d7a82ce634c454426ee4730/rest_framework_simplejwt/authentication.py#L129-L140). Let's use it as an example to create ours 😁!

## What we need to do

The [custom authentication](https://www.django-rest-framework.org/api-guide/authentication/#custom-authentication) mechanism must be able to:

* Retrieve and store the [JSON Web Key Set (JWKS)](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets) as it contains the public keys used to verify any JWT issued by the authorization server.
* Consult the authorization header and then analyze the value of the bearer token.
* If the token is valid, proceed with the request returning its details.
* Raise a 401 error if anything different occurs.

According to the documentation:

> To implement a custom authentication scheme, subclass `BaseAuthentication` and override the `.authenticate(self, request)` method. The method should return a two-tuple of (user, auth) if authentication succeeds, or `None` otherwise.
>
> In some circumstances instead of returning `None`, you may want to raise an `AuthenticationFailed` exception from the `.authenticate()` method.

So this is how we are going to start:

```python
from rest_framework import authentication


class JWTAccessTokenAuthentication(authentication.BaseAuthentication):
    def __init__(self, *args, **kwargs):
        pass

    def authenticate(self, request):
        pass
```

## Starting with tests

[DRF has a testing guide](https://github.com/encode/django-rest-framework/blob/781890b7df88086d9cba07904e53db346ec4a715/docs/api-guide/testing.md), so let's use it to create our first test scenario. 

### Raise error if no authorization header is available

The method `authenticate` receives a request. We can create a fake one using `APIRequestFactory`. So this is our first test:

```python
import pytest

from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory

from authentication_django_rest_framework.apps.core.api.authentication.authentications import JWTAccessTokenAuthentication


class TestAccessTokenValidation:
    def test_should_raise_error_if_no_authorization_header_is_available(self, jwt_access_token_authentication_scenario):
        # Arrange
        factory = APIRequestFactory()
        request = factory.get("/your-endpoint/v1/salt")
        backend = JWTAccessTokenAuthentication()
        # Act
        with pytest.raises(AuthenticationFailed) as authentication_failed_exception:
            backend.authenticate(request)
        # Assert
        assert authentication_failed_exception.value.status_code == 401
        assert authentication_failed_exception.value.detail == "Authorization header is not present"
```

To make this test pass:

```python
class JWTAccessTokenAuthentication(authentication.BaseAuthentication):
    def __init__(self, *args, **kwargs):
        pass

    def authenticate(self, request: HttpRequest):
        # Extract header
        header_authorization_value = request.headers.get("authorization")
        if not header_authorization_value:
            raise exceptions.AuthenticationFailed("Authorization header is not present")
        raise NotImplementedError
```

### Raise error if the authorization header value is invalid

About this test:

```python
def test_should_raise_error_when_authorization_header_value_is_invalid(self):
    # Arrange
    headers = {
        "HTTP_AUTHORIZATION": "Salt addicted",
    }
    factory = APIRequestFactory()
    request = factory.get("/your-endpoint/v1/salt", **headers)
    backend = JWTAccessTokenAuthentication()
    # Act
    with pytest.raises(AuthenticationFailed) as authentication_failed_exception:
        backend.authenticate(request)
    # Assert
    assert authentication_failed_exception.value.status_code == 401
    assert (
        authentication_failed_exception.value.detail
        == "Authorization header must start with Bearer followed by its token"
    )
```

A regular expression is an easy way to validate the value of the authorization header. Using [bearer token](https://oauth.net/2/bearer-tokens/#:~:text=Bearer%20Tokens%20are%20the%20predominant,such%20as%20JSON%20Web%20Tokens.), a regex such as `^[Bb]earer (.*)$` is enough. This is the concrete code to make the test pass:

```python
def authenticate(self, request: HttpRequest):
    # Extract header
    header_authorization_value = request.headers.get("authorization")
    if not header_authorization_value:
        raise exceptions.AuthenticationFailed("Authorization header is not present")
    # Extract raw JWT
    match = self.regex_bearer.match(header_authorization_value)
    if not match:
        raise exceptions.AuthenticationFailed("Authorization header must start with Bearer followed by its token")
    raw_jwt = match.groups()[-1]

    raise NotImplementedError
```

Why did I use `HTTP_AUTHORIZATION` instead of `Authorization`? I recommend [this Django comment](https://docs.djangoproject.com/en/4.0/ref/request-response/#django.http.HttpRequest.META) about `HTTP_` prefix.

### Raise error if the bearer has an invalid JWT in terms of its format

This is the part where we need to extract the ["kid" (key ID)](https://www.rfc-editor.org/rfc/rfc7515#section-4.1.4), which denotes which key was used to secure the JWT, and we can do this with the help of a library. We'll use [PyJWT](https://github.com/jpadilla/pyjwt). So, this is the test:

```python
def test_should_raise_error_if_bearer_has_invalid_jwt(self):
    # Arrange
    headers = {
        "HTTP_AUTHORIZATION": f"Bearer the-one-where-monica-gets-a-new-roommate",
    }
    factory = APIRequestFactory()
    request = factory.get("/your-endpoint/v1/friends", **headers)
    backend = JWTAccessTokenAuthentication()
    # Act
    with pytest.raises(AuthenticationFailed) as authentication_failed_exception:
        backend.authenticate(request)
    # Assert
    assert authentication_failed_exception.value.status_code == 401
    assert authentication_failed_exception.value.detail == "Bearer does not contain a valid JWT"
```

How is our authentication class so far:

```python
import re

from django.http import HttpRequest
from jwt import DecodeError
from jwt import PyJWKClient
from rest_framework import authentication
from rest_framework import exceptions

from authentication_django_rest_framework import settings


class JWTAccessTokenAuthentication(authentication.BaseAuthentication):
    regex_bearer = re.compile(r"^[Bb]earer (.*)$")

    def __init__(self, *args, **kwargs):
        self.jwks_client = PyJWKClient(settings.AUTH0_TENANT_JWKS)

    def authenticate(self, request: HttpRequest):
        # Extract header
        header_authorization_value = request.headers.get("authorization")
        if not header_authorization_value:
            raise exceptions.AuthenticationFailed("Authorization header is not present")
        # Extract supposed raw JWT
        match = self.regex_bearer.match(header_authorization_value)
        if not match:
            raise exceptions.AuthenticationFailed("Authorization header must start with Bearer followed by its token")
        raw_jwt = match.groups()[-1]
        # Extract Key ID
        try:
            key_id = self.jwks_client.get_signing_key_from_jwt(raw_jwt)
        except DecodeError:
            raise exceptions.AuthenticationFailed("Bearer does not contain a valid JWT")

        raise NotImplementedError
```

### Raise error if the provided token has no key ID

To test this scenario, we'll need a JWT, and we can generate as many as we want in [Token DEV](https://token.dev/). Another important thing is the JWKS. The library PyJWT requires it to verify the token. Looking at its implementation, I could understand its internal process and see where we could return the JWKS using a mock. To do it, let's use the fixture below, and by the way, I already included three kinds of tokens so we can use them in our tests:

```python
@pytest.fixture
def jwt_access_token_authentication_scenario(mocker):
    factory = APIRequestFactory()
    # You can create invalid tokens on TOKEN DEV: https://token.dev/
    token_with_invalid_kid = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImRvLXlvdS1saWtlLXNhbHQta2V5LWlkIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkNhcmwgU2FnYW4iLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNjQ2NjAwNTIxLCJleHAiOjE2NDY2MDQxMjF9.eyrVJEU84OsRUPIhsHpJVTqltn4ITD8LTJbhdgLU20VkDVzZS80u7HsTE_J4Ih4wdxOS3l6jBUOv-6DmBbGkahHM59SBY4aibsIQdGA9s2BWNatl90LpifI4Wjs-0ptkMDVO_i_Pie6RlscThM_jHdj8agi50YTJKRonXjYjLd1wNbleU53tss0ePslh3yynV8lvIjjNT2bSRHpcllh6qFLpiPm_k7K4Ft69oGq3k9BvXCaNGKd5zjsyzP8704aRj0DaXGrqZ-yYwo0FoAGheVl2EKccFn7l4kJTjnwnaeP3eO6FadLjjHS1KEMs6du4AzmSPJSY_T3thV-FmWjekg"
    token_with_valid_kid = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImZhWVp3X0NFSTBJUnotU2FHOWJoaSJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkNhcmwgU2FnYW4iLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNjQ2NjAwNTIxLCJleHAiOjE2NDY2MDQxMjF9.Obmnybm2oFwC0jOFSrZjVjY3F0W6w1zjCJFwp64rEeLcFa6yTh3zWGqiEtzlCYNGWNg1KS3JkycWqCRDGcsVkFhV1WRiLSHz8kA5m1rEk9A4pl1uSqt3vkGrC7X9h9LkPU2wp4YnCp3fZhIp7Z66rfy1L7Rebu6FyLnM-MFsk6IDikv01kFZkUNFQCYn5Uv1dY3xLWfdnOYllHmOs8boXt5z2DJKtWsNSe7-PBnrW0haQtihrI2cp9jVRj8815r1RBBfVbTQWslAQxdMxvk2ZtxCOvjv3UYG81k-ezVn2zoQXjG-JS4Uox6UQ5j6hR1arF-spkP1mXEtKH3EeB7G-g"
    valid_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZhWVp3X0NFSTBJUnotU2FHOWJoaSJ9.eyJpc3MiOiJodHRwczovL2FudHVuZXMudXMuYXV0aDAuY29tLyIsInN1YiI6ImZhY2Vib29rfDEwMjE4OTI1OTU2NDkxNjQyIiwiYXVkIjpbInVzZXItbWFuYWdlbWVudC9hcGl2aWV3LWRyZi1hcGkvYXBpL3YxIiwiaHR0cHM6Ly9hbnR1bmVzLnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE2NDY2MDI2ODUsImV4cCI6MTY0NjY4OTA4NSwiYXpwIjoiUDRjQkI4YThuMFJybE5FR1c3OWRKbmhBNFpyTVZ5S2oiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIn0.vKE-EdlbSx1KVXenEBkTG62pnUwoWIbHCCoW_Td2rr6pLIbuQzI2XW0lRtVRqlNhVifvFOAkRaascnm24S9_9KFii2IjMYJ4uQ0HpKTC55LgOV1KMkiE-qLS6aSVu5qftWpQmJRQJ9sPoie7siFL8cXznrkWlE4JFtEU4abFkjt5HEbL-BeX_70jrt60til1ImlMuDNmK6g0TiE0Oc6TKilHoRppUE1gN9XFvaaISJLZg5jtYvc-Gj0jeNOsjhyXZaiiCFSCyOZ8VNlZxyJ7EEyRHjVymRNH9vp_u8kKyMzV324Wlzmcbw5tQPUrk3hvnYf3IOT0QM5FFj6AvM228Q"
    fake_jwks = {
        "keys": [
            {
                "alg": "RS256",
                "kty": "RSA",
                "use": "sig",
                "n": "01EW-npmkOYEpwM6LLKpr6OJ1s_gQQz3biUzBY5QdH3JwWS37h6WFUdyv-CJEBWBetbzHLBYx_58HbGcGwmhht7bXJ8WDlRroxvt7MoYhINMaG8aXo3Giw0_st-VaEC8BuNEemfhJHBlcpJR8-ZdSLx5Q-rFojePOdnVrbcGIviVu9b6pOPHI1jnW_WmyBfG5XmXPHy2aL3OxjLFa8uVkxyHIu1mN3hWEdzZqewUqrFe91egCwT7u4MOkLgfmym_meXjXgIJZSp-GvNGJzk8Iyr0EszlrimP8eBgLg4AjEmwQzRkcRSXYsGCjO8-Dy4ecch-YNhOXpzWSf4bC22XYw",
                "e": "AQAB",
                "kid": "faYZw_CEI0IRz-SaG9bhi",
                "x5t": "ovFav4LfCHs4qZaOImYWpxoXdzA",
                "x5c": [
                    "MIIDAzCCAeugAwIBAgIJbqiVa0rLk9wpMA0GCSqGSIb3DQEBCwUAMB8xHTAbBgNVBAMTFGFudHVuZXMudXMuYXV0aDAuY29tMB4XDTIxMTAwNjE1MDIwNVoXDTM1MDYxNTE1MDIwNVowHzEdMBsGA1UEAxMUYW50dW5lcy51cy5hdXRoMC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDTURb6emaQ5gSnAzossqmvo4nWz+BBDPduJTMFjlB0fcnBZLfuHpYVR3K/4IkQFYF61vMcsFjH/nwdsZwbCaGG3ttcnxYOVGujG+3syhiEg0xobxpejcaLDT+y35VoQLwG40R6Z+EkcGVyklHz5l1IvHlD6sWiN4852dWttwYi+JW71vqk48cjWOdb9abIF8bleZc8fLZovc7GMsVry5WTHIci7WY3eFYR3Nmp7BSqsV73V6ALBPu7gw6QuB+bKb+Z5eNeAgllKn4a80YnOTwjKvQSzOWuKY/x4GAuDgCMSbBDNGRxFJdiwYKM7z4PLh5xyH5g2E5enNZJ/hsLbZdjAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFC21wXqeOFczGIEjlB+FCDVuaqleMA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEAl1I7bmq6ihafH9Zts+Fc9/Pe6kQ6C8yUMTJheNpiX6FTBfEWPuX/KWDz2WcC2/1S8tsQZPD3GJEF899LDa8F+mHY2adWMgFep5e5AejcwdmnZlCZoKmVAZ2HZHMgQr7RM0c0HZ2laBbzv4XcZPiDBP8YCuJlmL4zQFMeuWlA4ShCPB8Vk0VhDIJ/GBHvKYgy2pSa7mfZpoC4JcUc5XV4q6fZahEL27eqC3l4ffXaEcBK1axy769SaJpxHgpEeniMkfGcbuAYamInO64lhqKLf0hq9kQ6WId17hOt9nMa2q2ct88s5ZJirDzkE9uEKr0m9tqqaTgupN/xgq0xHVXkww=="
                ],
            },
            {
                "alg": "RS256",
                "kty": "RSA",
                "use": "sig",
                "n": "uPw-p0UpUVWd54qkPEfxt6GRqt1kJFDmzWmwVBfJxtRLp4m7jixzX9KNQrRWhBNJ1rlAxqpookqeB6cm74aEJ_UAJ-uPHnGKqYdA41VBOMrCgMl-DH86peK-HtGg_0vg6D0qMkcmXZJBGeKdK6UAhw0uwALEqN_twlBwdvtVocS30fvYdt_JqTnSb8uimRnoaA5GoAet5fAG7cph5ZnZuIAYdVf4T3RiPBdRNtHJbP9cuCZatJWb7CabjuIN9wmztAsex8n9wuSp06_wuVWJQQiCDGQF8tT11yn4TlFnzdlwxpQ8ngrvsoAt0KPfA_1rrFBL9vhGIGFkkRvfC3WFUw",
                "e": "AQAB",
                "kid": "1Yjr6qd1riVeCrHC-DuhH",
                "x5t": "oLlrWY6HThi71U-AJZwN4Jn24IU",
                "x5c": [
                    "MIIDAzCCAeugAwIBAgIJU21sCpl+udZDMA0GCSqGSIb3DQEBCwUAMB8xHTAbBgNVBAMTFGFudHVuZXMudXMuYXV0aDAuY29tMB4XDTIxMTAwNjE1MDIwNloXDTM1MDYxNTE1MDIwNlowHzEdMBsGA1UEAxMUYW50dW5lcy51cy5hdXRoMC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC4/D6nRSlRVZ3niqQ8R/G3oZGq3WQkUObNabBUF8nG1EunibuOLHNf0o1CtFaEE0nWuUDGqmiiSp4HpybvhoQn9QAn648ecYqph0DjVUE4ysKAyX4Mfzql4r4e0aD/S+DoPSoyRyZdkkEZ4p0rpQCHDS7AAsSo3+3CUHB2+1WhxLfR+9h238mpOdJvy6KZGehoDkagB63l8AbtymHlmdm4gBh1V/hPdGI8F1E20cls/1y4Jlq0lZvsJpuO4g33CbO0Cx7Hyf3C5KnTr/C5VYlBCIIMZAXy1PXXKfhOUWfN2XDGlDyeCu+ygC3Qo98D/WusUEv2+EYgYWSRG98LdYVTAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFG1wVasCVyhsSQnaDuAxSj0AF3/qMA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEArfE7/0Khu6Dupfyy9dy5FdL9HUxBF1YgFeOWPBZg8VilRkldjq+S8axYUdbhpyCuEcnnInqO17t+KJ5/oRdEb1Ma4Lj4XD2GdyN1wTniUoq2P/r5aGRqToISAEtwpvVgYmQZflDC9xYq+d5ddZ43LfouWKSkE01OfL7YQJM+yNWm4dwQAT0gXNchnBGRtlajhStYLDb6Sci/AizEIMcqZnkXoBJQXwaEBYZCsXCkWgUoiQFVPzZr07m4iQF4FtoyPsjlbxbhQ2ymEbVCS986zmApkTfv9GcTSpIonoom7fMjkww+7s5/CoKgPCvYeEu+phmW8nzY8o0FsSeNUfI6nw=="
                ],
            },
        ]
    }
    mocked_jwks_client = PyJWKClient("https://agrabah/.well-known/jwks.json")
    mocker.patch.object(mocked_jwks_client, "get_jwk_set", lambda: PyJWKSet.from_dict(fake_jwks))
    extra_internal_options = {
        "internal_extra_jwt_decode_options": {"verify_exp": False},
        "internal_jwks_client": mocked_jwks_client,
    }
    backend = JWTAccessTokenAuthentication(**extra_internal_options)
    return factory, backend, (token_with_invalid_kid, token_with_valid_kid, valid_token)
```

Did you notice the `extra_internal_options` variable and how we're using it to instantiate our authentication class? We'll get there soon. Before showing how is the authentication class, let's see the test:

```python
def test_should_raise_error_if_provided_jwt_has_no_kid(self, jwt_access_token_authentication_scenario):
    # Arrange
    factory, backend, tokens = jwt_access_token_authentication_scenario
    token_with_invalid_kid, _ = tokens
    headers = {
        "HTTP_AUTHORIZATION": f"Bearer {token_with_invalid_kid}",
    }
    request = factory.get("/your-endpoint/v1/friends", **headers)
    # Act
    with pytest.raises(AuthenticationFailed) as authentication_failed_exception:
        backend.authenticate(request)
    # Assert
    assert authentication_failed_exception.value.status_code == 401
    assert authentication_failed_exception.value.detail == "JWT does not have a valid Key ID"
```

The authentication class so far:

```python
import re

from django.http import HttpRequest
from jwt import DecodeError
from jwt import PyJWKClient
from jwt import PyJWKClientError
from rest_framework import authentication
from rest_framework import exceptions

from authentication_django_rest_framework import settings


class JWTAccessTokenAuthentication(authentication.BaseAuthentication):
    regex_bearer = re.compile(r"^[Bb]earer (.*)$")

    def __init__(self, *args, **kwargs):
        internal_extra_jwt_decode_options = kwargs.get("internal_extra_jwt_decode_options")
        if internal_extra_jwt_decode_options:
            self.internal_extra_jwt_decode_options = internal_extra_jwt_decode_options
        # Retrieving JWKS
        jwks_client = kwargs.get("internal_jwks_client")
        if jwks_client:
            self.jwks_client = jwks_client
        else:
            self.jwks_client = PyJWKClient(settings.AUTH0_TENANT_JWKS)

    def authenticate(self, request: HttpRequest):
        # Extract header
        header_authorization_value = request.headers.get("authorization")
        if not header_authorization_value:
            raise exceptions.AuthenticationFailed("Authorization header is not present")
        # Extract supposed raw JWT
        match = self.regex_bearer.match(header_authorization_value)
        if not match:
            raise exceptions.AuthenticationFailed("Authorization header must start with Bearer followed by its token")
        raw_jwt = match.groups()[-1]
        # Extract "kid"
        try:
            key_id = self.jwks_client.get_signing_key_from_jwt(raw_jwt)
        except PyJWKClientError as e:
            error_message = str(e)
            if "Unable to find a signing key" in error_message:
                raise exceptions.AuthenticationFailed("JWT does not have a valid Key ID")
            else:
                raise NotImplementedError
        except DecodeError:
            raise exceptions.AuthenticationFailed("Bearer does not contain a valid JWT")

        raise NotImplementedError
```

Depending on which error `PyJWKClientError` has, we raise `NotImplementedError`. Actually, this is bad practice. So instead, we should ask ourselves: do we raise an exception to show a `5XX` to whoever is calling the API, or do we treat it as `401`? If I were doing this for real, I would scrutinize the library I'm using for tips. So I leave this up to you. Let's move on.

### Raise error if the provided token has an invalid signature

This is our last test where we want an error to be raised. This is our test:

```python
def test_should_raise_error_if_provided_jwt_has_invalid_signature(self, jwt_access_token_authentication_scenario):
    # Arrange
    factory, backend, tokens = jwt_access_token_authentication_scenario
    _, token_with_valid_kid, _ = tokens
    headers = {
        "HTTP_AUTHORIZATION": f"Bearer {token_with_valid_kid}",
    }
    request = factory.get("/your-endpoint/v1/friends", **headers)
    # Act
    with pytest.raises(AuthenticationFailed) as authentication_failed_exception:
        backend.authenticate(request)
    # Assert
    assert authentication_failed_exception.value.status_code == 401
    assert authentication_failed_exception.value.detail == "Bearer token is invalid"
```

The business code:

```python
def authenticate(self, request: HttpRequest):
    # Extract header
    # (...)
    # Extract "kid"
    # (...)

    options = None
    extra_params = {"algorithms": ["RS256"], "audience": settings.AUTH0_MY_APPLICATION_AUDIENCE}
    # See the constructor method to understand this
    if hasattr(self, "internal_extra_jwt_decode_options"):
        options = getattr(self, "internal_extra_jwt_decode_options")
    try:
        data = jwt.decode(raw_jwt, key_id.key, **extra_params, options=options)
    except InvalidTokenError:
        raise exceptions.AuthenticationFailed("Bearer token is invalid")

    raise NotImplementedError
```

Do you remember the `extra_internal_options` dictionary? We're using it to activate some [flags during the decoding process](https://github.com/jpadilla/pyjwt/blob/827d4425dbd2e6f9b521e514ced889cfb3aada21/jwt/api_jwt.py#L73-L83), which is vital for our tests to continue working as all tokens JWT might expire.

Another important thing is about `InvalidTokenError`. This is a [generic base class for all token validation exceptions](https://github.com/jpadilla/pyjwt/blob/7183ccd5aea1f3bdbe16f12174f489370ca2cdcc/jwt/exceptions.py#L9).

### Should return token user

Finally, the point where the authentication class is functional! The test scenario:

```python
    def test_should_return_jwt_user(self, jwt_access_token_authentication_scenario, settings, mocker):
        # Arrange
        settings.AUTH0_MY_APPLICATION_AUDIENCE = "user-management/apiview-drf-api/api/v1"
        mocker.patch(
            "authentication_django_rest_framework.apps.core.api.authentication.authentications.settings", settings
        )
        factory, backend, tokens = jwt_access_token_authentication_scenario
        *_, valid_token = tokens
        headers = {
            "HTTP_AUTHORIZATION": f"Bearer {valid_token}",
        }
        request = factory.get("/your-endpoint/v1/friends", **headers)
        expected_token = {
            "iss": "https://antunes.us.auth0.com/",
            "sub": "facebook|10218925956491642",
            "aud": ["user-management/apiview-drf-api/api/v1", "https://antunes.us.auth0.com/userinfo"],
            "iat": 1646602685,
            "exp": 1646689085,
            "azp": "P4cBB8a8n0RrlNEGW79dJnhA4ZrMVyKj",
            "scope": "openid profile email",
        }
        # Act
        result = backend.authenticate(request)
        # Assert
        assert result == (TokenUser(expected_token), expected_token)
```

Instead of ending with `raise NotImplementedError`, I just changed it to the following:

```python
return TokenUser(data), data
```

That's it 😛!

### Things you should handle, but we didn't cover

What happens if we can't retrieve the JWKS? How about the [audience](https://community.auth0.com/t/understanding-how-the-audience-concept-actually-works/34011/3?u=willianantunes)? Well, I could keep going, but I think you get the point. It's critical to cover other scenarios if they make sense for you.

## Seeing the authentication class in action

Here's the example view using it:

```python
class ExampleView(APIView):
    authentication_classes = [JWTAccessTokenAuthentication]

    def get(self, request):
        authenticated_user: TokenUser = request.user
        body = {
            "user": authenticated_user.id,
        }
        return Response(body, status=status.HTTP_200_OK)
```

Here's the test validating it:

```python
import pytest


@pytest.fixture
def accept_fake_access_token(mocker):
    mock_class = mocker.patch(
        "authentication_django_rest_framework.apps.core.api.authentication.authentications.PyJWKClient"
    )
    mock_class.return_value = mocker.MagicMock()
    mocked_jwt = mocker.patch("authentication_django_rest_framework.apps.core.api.authentication.authentications.jwt")
    fake_data = {
        "iss": "https://antunes.us.auth0.com/",
        "sub": "facebook|10218925956491642",
        "aud": ["user-management/apiview-drf-api/api/v1", "https://antunes.us.auth0.com/userinfo"],
        "iat": 1646602685,
        "exp": 1646689085,
        "azp": "P4cBB8a8n0RrlNEGW79dJnhA4ZrMVyKj",
        "scope": "openid profile email",
    }
    mocked_jwt.decode.return_value = fake_data
    return fake_data


class TestExampleView:
    def test_should_return_200_with_user_attributes(self, accept_fake_access_token, client):
        # Arrange
        token_body = accept_fake_access_token
        header = {
            "HTTP_AUTHORIZATION": "Bearer you-should-watch-arcane",
        }
        # Act
        response = client.get("/api/v1/friends", content_type="application/json", **header)
        # Assert
        assert response.status_code == 200
        result = response.json()
        assert result == {"user": token_body["sub"]}
```

If you many other ways to configure it, for instance, [you can configure it globally](https://www.django-rest-framework.org/api-guide/authentication/#setting-the-authentication-scheme).

## Next steps and conclusion

The authentication class we created has an issue. Every time Django starts, it will download the JWKS. So, if we're using [gunicorn](https://docs.djangoproject.com/en/4.0/howto/deployment/wsgi/gunicorn/) with 5 workers, that means it will download the same thing 5 times. It worsens if our service runs using 5 pods, representing 25 requests, mainly because [Auht0 has a rate limit for the JWKS endpoint](https://auth0.com/docs/troubleshoot/customer-support/operational-policies/rate-limit-policy/authentication-api-endpoint-rate-limits#limits-for-non-production-tenants-of-paying-customers-and-all-tenants-of-free-customers). We can solve it using a cache solution, which we'll see in the next blog entry.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/03/authentication-django-rest-framework).

Posted listening to [Closer Than Close, Bee Gees](https://youtu.be/JTL0WC4oyis) 🎶.
