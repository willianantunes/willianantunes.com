---
id: ca5aeae0-bd1d-11ec-ad21-75447491b9ef
title: Estimating an initial Redis setup through Locust
date: 2022-04-16T00:52:53.041Z
cover: /assets/posts/blog-21-estimating-an-initial-redis-setup-through-locust.png
description: Locust is designed to work with HTTP requests. How about doing load
  testing with non-HTTP systems such as Redis and using the pleasant Django's
  cache abstraction? 
tags:
  - locust
  - django
  - redis
---
I had to estimate an initial [ElastiCache for Redis](https://aws.amazon.com/elasticache/redis/) architecture where I'd have an application using it only as a cache layer. No brokers, no chats, no analytics, only cache 🗃. It was a straightforward scenario where no complex configuration was needed.

## The test plan

I created a test plan targeting the Redis instead of the application to estimate the initial setup. This approach has some advantages, and they include:

* It's easy to hit the target system directly as it involves no intermediary layers.
* Testing the application may need an authentication token, cookies, and whatever is required in its internals to accept an incoming request and then use the cache.
* You can build the whole scenario faster and make it more manageable.

By the way, I swear I attempted to use [JMeter](https://github.com/apache/jmeter) first because it's easy, and typically, it's fairly direct in its configuration. Sadly I couldn't do it this time because [The Redis Data Set](https://jmeter-plugins.org/wiki/RedisDataSet/) plugin was throwing exceptions. So, because the clock was ticking, I decided to use a new tool: [Locust](https://locust.io/).

### Configuring Locust

As Locust is written in Python, to make the test closer to production environment, I decided to write `user tasks` in a way that I could use the [Django's Cache Framework](https://docs.djangoproject.com/en/4.0/topics/cache/). The problem is, though, Locust handles only HTTP requests. So in order to [test non-HTTP systems](https://docs.locust.io/en/2.8.1/testing-other-systems.html), I wrote a custom abstract `User` class:

```python
import logging
import time

import django
import wrapt

from common import settings as app_settings
from django.conf import settings
from locust import User
from locust.env import Environment


class DjangoRedisClient(wrapt.ObjectProxy):
    def __init__(self, wrapped, locust_handler):
        super(DjangoRedisClient, self).__init__(wrapped)
        self._self_wrapper = locust_handler

    def get(self, *args, **kwargs):
        return self._self_wrapper(self.__wrapped__.get, args, kwargs)

    def get_many(self, *args, **kwargs):
        return self._self_wrapper(self.__wrapped__.get_many, args, kwargs)

    def set(self, *args, **kwargs):
        return self._self_wrapper(self.__wrapped__.set, args, kwargs)


class DjangoRedisUser(User):
    abstract = True

    def __init__(self, environment: Environment):
        super().__init__(environment)
        logging.info("Initializing user...")

        # Configure Django
        try:
            settings.configure(
                CACHES={
                    "default": {
                        "BACKEND": "django.core.cache.backends.redis.RedisCache",
                        "LOCATION": app_settings.REDIS_CONNECTION_STRING,
                    }
                }
            )
            django.setup()
        except RuntimeError as e:
            ignore_error = "already configured" in str(e).lower()
            if not ignore_error:
                raise e

        request_event = environment.events.request

        def locust_handler(wrapped, args, kwargs):
            custom_name = kwargs.get("name")
            request_meta = {
                "request_type": "Django’s cache framework (Redis)",
                "name": custom_name if custom_name else wrapped.__name__,
                "start_time": time.time(),
                "response_length": 0,
                "response": None,
                "context": {},
                "exception": None,
            }
            start_perf_counter = time.perf_counter()
            try:
                request_meta["response"] = wrapped(*args, **kwargs)
            except Exception as e:
                request_meta["exception"] = e
            request_meta["response_time"] = (time.perf_counter() - start_perf_counter) * 1000
            # This is what makes the request actually get logged in Locust!
            request_event.fire(**request_meta)
            return request_meta["response"]

        from django.core.cache import cache as original_cache

        self.client = DjangoRedisClient(original_cache, locust_handler)
```

Some essential things to understand in this code:

* This is the only place where Django is configured.
* Django will not throw an exception saying it was already configured if you add more users.
* The method `locust_handler` collects the metrics needed for Locust; in other words, this is how Locust shows the results to you.
* The class `DjangoRedisClient` uses the proxy design pattern through [wrapt](https://wrapt.readthedocs.io/en/latest/) intercepting three methods: [`get`](https://docs.djangoproject.com/en/4.0/topics/cache/#django.core.caches.cache.get), [`get_many`](https://docs.djangoproject.com/en/4.0/topics/cache/#django.core.caches.cache.get_many), and [`set`](https://docs.djangoproject.com/en/4.0/topics/cache/#django.core.caches.cache.set). This has the purpose of using `locust_handler`.

This is how we use it in a [`locustfile`](https://docs.locust.io/en/2.8.1/writing-a-locustfile.html):

```python
class PerformanceTest(DjangoRedisUser):
    base_key = settings.DATA_LOADER_REDIS_BASE_KEY
    entries = settings.DATA_LOADER_REDIS_ENTRIES_BY_KEY

    @task
    def save_value_to_key_with_5sec_timeout_claim_1(self):
        key = f"{self.base_key}_CLAIMS_1"
        value = {
            "gender": "female",
            "addresses": [
                {
                    "identification": "billing",
                    "country": "BR",
                    "stateOrProvince": "GO",
                    "city": "Inhumas",
                    "houseNumberOrName": "42",
                    "street": "R Saleiro",
                    "postalCode": "75400000",
                },
            ],
        }
        self.client.set(key, value, timeout=5)

    @task
    def save_value_to_key_with_2sec_timeout_claim_2(self):
        key = f"{self.base_key}_CLAIMS_2"
        value = {
            "gender": "male",
            "addresses": [
                {
                    "identification": "home",
                    "country": "BR",
                    "stateOrProvince": "BA",
                    "city": "Jequiezinho",
                    "houseNumberOrName": "16",
                    "street": "R do Sal",
                    "postalCode": "45204550",
                },
            ],
        }
        self.client.set(key, value, timeout=2)

    @task
    def save_value_to_key_with_10sec_timeout_claim_3(self):
        key = f"{self.base_key}_CLAIMS_3"
        value = {
            "gender": None,
        }
        self.client.set(key, value, timeout=10)

    @task
    def get_value_key_claim_1(self):
        key = f"{self.base_key}_CLAIMS_1"
        self.client.get(key)

    @task
    def get_value_key_claim_2(self):
        key = f"{self.base_key}_CLAIMS_2"
        self.client.get(key)

    @task
    def get_value_key_claim_3(self):
        key = f"{self.base_key}_CLAIMS_3"
        self.client.get(key)

    @task
    def retrieve_all_keys_from_claims_with_get_many(self):
        all_claims_keys = [f"{self.base_key}_CLAIMS_{index}" for index in range(self.entries)]
        self.client.get_many(all_claims_keys)

    @task
    def retrieve_all_keys_from_m2m_with_get_many(self):
        all_m2m_keys = [f"{self.base_key}_M2M_{index}" for index in range(self.entries)]
        self.client.get_many(all_m2m_keys)
```

### Loading data into Redis

You can understand how much memory your in-memory database consumes after some load. You can also use the same load during your own test plan. For example, using Locust, we can insert a data loader using the following [event](https://docs.locust.io/en/2.8.1/writing-a-locustfile.html#events) in a `locustfile`:

```python
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    logging.info("Loading data into Redis!")
    load_data_into_redis()
```

The data loader uses the Redis client instead of the Django one:

```python
import logging

import redis

from common import settings
from django.core.cache.backends.redis import RedisSerializer


def _set_many(pipeline, data, timeout):
    pipeline.mset({k: RedisSerializer().dumps(v) for k, v in data.items()})
    for key in data:
        pipeline.expire(key, timeout)
    pipeline.execute()


def load_data_into_redis():
    redis_instance = redis.from_url(settings.REDIS_CONNECTION_STRING)
    base_key = settings.DATA_LOADER_REDIS_BASE_KEY
    number_of_keys = settings.DATA_LOADER_REDIS_ENTRIES_BY_KEY
    logging.info(f"Creating {number_of_keys*2} keys")
    sample_value_user_metadata = {
        "birthday": "1985-08-04",
        "gender": "female",
        "addresses": [
            {
                "identification": "billing",
                "country": "BR",
                "stateOrProvince": "GO",
                "city": "Inhumas",
                "houseNumberOrName": "42",
                "street": "R Saleiro",
                "postalCode": "75400000",
            },
            {
                "identification": "home",
                "country": "BR",
                "stateOrProvince": "BA",
                "city": "Jequiezinho",
                "houseNumberOrName": "16",
                "street": "R do Sal",
                "postalCode": "45204550",
            },
        ],
    }
    sample_value_m2m_tokens = {
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL3NhbGFyLXV5dW5pLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJiYWNQeTU2bEhQamM0VHk2Z094aEpucFpBMlc1YlplWUBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9zYWxhci11eXVuaS51cy5hdXRoMC5jb20vYXBpL3YyLyIsImlhdCI6MTY0NjQwMDQ0OCwiZXhwIjoxNjQ5OTc2NTEyLCJhenAiOiJiYWNQeTU2bEhQamM0VHk2Z094aEpucFpBMlc1YlplWSIsInNjb3BlIjoicmVhZDp1c2VycyB1cGRhdGU6dXNlcnMgZGVsZXRlOnVzZXJzIGNyZWF0ZTp1c2VycyByZWFkOnVzZXJzX2FwcF9tZXRhZGF0YSB1cGRhdGU6dXNlcnNfYXBwX21ldGFkYXRhIGRlbGV0ZTp1c2Vyc19hcHBfbWV0YWRhdGEgY3JlYXRlOnVzZXJzX2FwcF9tZXRhZGF0YSByZWFkOnVzZXJfY3VzdG9tX2Jsb2NrcyBjcmVhdGU6dXNlcl9jdXN0b21fYmxvY2tzIGRlbGV0ZTp1c2VyX2N1c3RvbV9ibG9ja3MiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMifQ.lJ9saKPaZ-s4LWQrBYQJCakDrYOFpqLz_Of7dZySagP8bwUVeeCAHe0GEQMw9ND8IDTBOU5e2a_wO5sQIq5yger8xN37a5T3tlOCDP-W-qy4hmoJCw2cQkABGPG5F-ZXqGSVTi-P4zbby76LltVkKoRVqWnSj1Wg1JxTchfbGqlIY6yVOfUHFQps2ax3kee9JCZiif_uaQqQNajF02ZtyvTB-4XU4IqkovcMipM0QuBYdzPd7JbDsSkcbLyEhFfxH8Tn95uXjk1gmpNQn0i6LlRui40VXJ3c4dcGcg8fR8aUzpxjR6nIWoZ_VJFSOBO07NBrFmn9QNv4Q5YRr7sATg",
        "scope": "read:users update:users delete:users create:users read:users_app_metadata update:users_app_metadata delete:users_app_metadata create:users_app_metadata read:user_custom_blocks create:user_custom_blocks delete:user_custom_blocks",
        "expires_in": 86400,
        "token_type": "Bearer",
    }
    claims_dict_keys = {}
    m2m_tokens_dict_keys = {}
    for i in range(number_of_keys):
        claims_dict_keys[f"{base_key}_CLAIMS_{i}"] = sample_value_user_metadata
        m2m_tokens_dict_keys[f"{base_key}_M2M_{i}"] = sample_value_m2m_tokens
    logging.info("Cleaning current keys")
    claims_dict_keys.keys()
    redis_instance.delete(*[*claims_dict_keys])
    redis_instance.delete(*[*m2m_tokens_dict_keys])
    current_info = redis_instance.info()
    logging.info("Current value of used_memory_human: %s", current_info["used_memory_human"])
    logging.info("Current value of used_memory_peak_human: %s", current_info["used_memory_peak_human"])
    ten_minutes = 60 * 10
    # Doing the thing for `claims_dict_keys`
    logging.info("Pipeline with claims_dict_keys...")
    _set_many(redis_instance.pipeline(), claims_dict_keys, ten_minutes)
    # Doing the thing for `m2m_tokens_dict_keys`
    logging.info("Pipeline with m2m_tokens_dict_keys...")
    _set_many(redis_instance.pipeline(), m2m_tokens_dict_keys, ten_minutes)
    current_info = redis_instance.info()
    logging.info("Current value of used_memory_human: %s", current_info["used_memory_human"])
    logging.info("Current value of used_memory_peak_human: %s", current_info["used_memory_peak_human"])
```

## Starting Locust and accessing its web interface

Having the script, I could simply start the [Locust's web interface](https://docs.locust.io/en/2.8.1/quickstart.html#locust-s-web-interface) with the command:

```bash
locust -f your_locustfile.py
```

Check out the statistics table:

![It has a statistics table with three rows. Each row representing one type of request on Redis.](/assets/posts/blog-21-order-1-image-1-locust-statistics-table.png "Locust's web interface: Statistics.")

Some charts:

![Two charts, one describing total requests per second, and another one response times in milliseconds.](/assets/posts/blog-21-order-1-image-2-locust-charts.png "Locust's web interface: Charts.")

As I used the [default logging](https://docs.locust.io/en/2.8.1/logging.html) configured by Locust, all the messages were sent to `stderr`: 

```
[2022-04-15 23:21:27,503] 2f358f064941/INFO/locust.main: Starting web interface at http://0.0.0.0:8089 (accepting connections from all network interfaces)
[2022-04-15 23:21:27,515] 2f358f064941/INFO/locust.main: Starting Locust 2.8.6
[2022-04-15 23:25:39,949] 2f358f064941/INFO/root: Loading data into Redis!
[2022-04-15 23:25:39,950] 2f358f064941/INFO/root: Creating 400000 keys
[2022-04-15 23:25:40,123] 2f358f064941/INFO/root: Cleaning current keys
[2022-04-15 23:25:40,876] 2f358f064941/INFO/root: Current value of used_memory_human: 853.33K
[2022-04-15 23:25:40,877] 2f358f064941/INFO/root: Current value of used_memory_peak_human: 13.26M
[2022-04-15 23:25:40,877] 2f358f064941/INFO/root: Pipeline with claims_dict_keys...
[2022-04-15 23:25:45,267] 2f358f064941/INFO/root: Pipeline with m2m_tokens_dict_keys...
[2022-04-15 23:25:50,097] 2f358f064941/INFO/root: Current value of used_memory_human: 400.98M
[2022-04-15 23:25:50,097] 2f358f064941/INFO/root: Current value of used_memory_peak_human: 447.24M
[2022-04-15 23:25:50,108] 2f358f064941/INFO/locust.runners: Ramping to 5 users at a rate of 1.00 per second
[2022-04-15 23:25:50,108] 2f358f064941/INFO/root: Initializing user...
[2022-04-15 23:25:51,743] 2f358f064941/INFO/root: Initializing user...
[2022-04-15 23:25:53,741] 2f358f064941/INFO/root: Initializing user...
[2022-04-15 23:25:55,678] 2f358f064941/INFO/root: Initializing user...
[2022-04-15 23:25:57,231] 2f358f064941/INFO/root: Initializing user...
[2022-04-15 23:25:57,231] 2f358f064941/INFO/locust.runners: All users spawned: {"PerformanceTest": 5} (5 total users)
```

## Looking at Redis behavior during the load test

While the load testing was being executed, I was checking Redis through `docker stats` and `redis-cli`. The latter has the [`INFO` command](https://redis.io/commands/info/), which is quite helpful to get insights! I did the first load test locally, but it wasn't sufficient. So I also did it in an ElastiCache Redis instance on AWS.

## Conclusion

When I thought I was in trouble because of the short time I had to estimate the Redis instance, Locust was there! I really believed it would consume lots of time because you have to write the scripts yourself, but it's the opposite, even with a non-HTTP system, such as Redis. Furthermore, [Locust's API](https://docs.locust.io/en/stable/api.html) seems simple, and it was easy to follow for what I needed.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/04/load-testing-redis-locust).

Posted listening to [Cliffs Of Dover, Eric Johnson](https://youtu.be/jyIiC4WdFNU) 🎶.
