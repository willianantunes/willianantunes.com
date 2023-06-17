---
id: b2da9a60-0d11-11ee-9530-0fc3b686e90a
title: Spy on Python Objects Using Monkey Patching
date: 2023-06-17T15:12:03.144Z
cover: /assets/posts/blog-33-spy-on-python-objects-using-monkey-patching.png
description: This blog post will walk you through spying on objects, enabling
  you to monitor, intercept, and analyze object behavior.
tags:
  - python
  - proxy pattern
  - monkey patching
---
**Warning:** This is a note, so don't expect much 😅!

**First things first:** How do I check if an exception was thrown so I report it to [Locust](https://docs.locust.io/en/2.15.1/testing-other-systems.html)? Look at [this code](https://github.com/Unleash/unleash-client-python/blob/0805c6b39836dfe995e141e948efab9ddbcbb59e/UnleashClient/api/features.py#L83-L85) so you can clearly see what I mean.

You see, the code I mentioned above is from a library. I can't change its code. So, one way to circumvent it is by doing monkey patching to spy on what the code is doing on runtime. Usually, you do monkey patch often during tests using [Python Magic Mock](https://docs.python.org/3/library/unittest.mock.html#quick-guide), like [this one](https://github.com/willianantunes/tutorials/blob/1bbc0a55ce1658047f00269a437f007ad37a0da9/2022/01/transactions-with-django-stomp/tests/transactions_with_django_stomp/change_callback_do_the_thing.py#L24-L37).

To do it properly, I had to understand how [gevent](https://github.com/gevent/gevent) implements monkey patching by analyzing the method *[patch_all](https://github.com/gevent/gevent/blob/23c942848cf3f12bbdbe5b87b43793c80121929c/src/gevent/monkey.py#L1201-L1205)*. In my case, you should extract the real objects first:

```python
# These are the original functions
unleash_client_module = __import__("UnleashClient")
target_load_features = getattr(unleash_client_module, "load_features")
fetch_and_load_features = getattr(unleash_client_module, "fetch_and_load_features")
aggregate_and_send_metrics = getattr(unleash_client_module, "aggregate_and_send_metrics")
register_client = getattr(unleash_client_module, "register_client")
# These are the original LOGGERs
unleash_client_api_features_module = __import__("UnleashClient").api.features
unleash_client_api_features_logger = getattr(unleash_client_api_features_module, "LOGGER")
unleash_client_api_metrics_module = __import__("UnleashClient").api.metrics
unleash_client_api_metrics_logger = getattr(upythonnleash_client_api_metrics_module, "LOGGER")
unleash_client_api_register_module = __import__("UnleashClient").api.register
unleash_client_api_register_logger = getattr(unleash_client_api_register_module, "LOGGER")
```

Then you can place your own object in the original object's path.

```python
# Placing a wrapper that spies when the function is called
setattr(unleash_client_module, "load_features", CallableWrapper(target_load_features, None))
fetch_and_load_features_proxy = CallableWrapper(fetch_and_load_features, "api.features", self.error_holder)
setattr(unleash_client_module, "fetch_and_load_features", fetch_and_load_features_proxy)
aggregate_and_send_metrics_proxy = CallableWrapper(aggregate_and_send_metrics, "api.metrics", self.error_holder)
setattr(unleash_client_module, "aggregate_and_send_metrics", aggregate_and_send_metrics_proxy)
register_client_proxy = CallableWrapper(register_client, "api.register", self.error_holder)
setattr(unleash_client_module, "register_client", register_client_proxy)
# Placing wrappers that spy when certain methods are executed through the LOGGERs
features_logger = CallableLoggerWrapper(unleash_client_api_features_logger, "api.features", self.error_holder)
setattr(unleash_client_api_features_module, "LOGGER", features_logger)
metrics_logger = CallableLoggerWrapper(unleash_client_api_metrics_logger, "api.metrics", self.error_holder)
setattr(unleash_client_api_metrics_module, "LOGGER", metrics_logger)
register_logger = CallableLoggerWrapper(unleash_client_api_register_logger, "api.register", self.error_holder)
setattr(unleash_client_api_register_module, "LOGGER", register_logger)
```

By the way, understanding where the object you are trying to spy on is crucial. If you place the monkey patch in the wrong path, you either receive an error or don't have the expected result. That's why a simple test can come in handy in such scenarios.

```python
import unittest

from dataclasses import dataclass

import wrapt

from requests.exceptions import MissingSchema
from UnleashClient import UnleashClient
from UnleashClient import register_client
from UnleashClient.api import get_feature_toggles
from UnleashClient.api import send_metrics


@dataclass(frozen=True)
class ErrorDetails:
    _type: str
    message: str
    exception: Exception | None = None


class TestProxy(unittest.TestCase):
    def test_patch_logger(self):
        error_holder = {}

        class CallableWrapper(wrapt.ObjectProxy):
            _self_unexpected_messages = ["fetch failed due to", "submission failed", "due to exception"]

            def __init__(self, wrapped: object, target: str):
                super().__init__(wrapped)
                self._self_target = target

            def _store_error_message_if_required(self, key_name: str, args: tuple):
                message = args[0].lower()
                if any([exception for exception in self._self_unexpected_messages if exception in message]):
                    array = error_holder.get(self._self_target, [])
                    if len(args) == 1:
                        array.append(ErrorDetails(key_name, message))
                        error_holder[self._self_target] = array
                    elif len(args) == 2:
                        raised_exception = args[1]
                        array.append(ErrorDetails(key_name, message, raised_exception))
                        error_holder[self._self_target] = array

            def warning(self, *args, **kwargs):
                self._store_error_message_if_required(self.warning.__name__, args)
                return self.__wrapped__.warning(*args, **kwargs)

            def exception(self, *args, **kwargs):
                self._store_error_message_if_required(self.exception.__name__, args)
                return self.__wrapped__.warning(*args, **kwargs)

        # Collect object
        unleash_client_api_features_module = __import__("UnleashClient").api.features
        unleash_client_api_features_logger = getattr(unleash_client_api_features_module, "LOGGER")
        unleash_client_api_metrics_module = __import__("UnleashClient").api.metrics
        unleash_client_api_metrics_logger = getattr(unleash_client_api_metrics_module, "LOGGER")
        unleash_client_api_register_module = __import__("UnleashClient").api.register
        unleash_client_api_register_logger = getattr(unleash_client_api_register_module, "LOGGER")
        # Set proxies
        api_features_proxy = CallableWrapper(unleash_client_api_features_logger, "api.features")
        setattr(unleash_client_api_features_module, "LOGGER", api_features_proxy)
        api_metrics_proxy = CallableWrapper(unleash_client_api_metrics_logger, "api.metrics")
        setattr(unleash_client_api_metrics_module, "LOGGER", api_metrics_proxy)
        api_register_proxy = CallableWrapper(unleash_client_api_register_logger, "api.register")
        setattr(unleash_client_api_register_module, "LOGGER", api_register_proxy)
        # Act
        send_metrics("fake-url", {}, {}, {})
        get_feature_toggles("fake-url", "", "", {}, {})
        with self.assertRaises(MissingSchema):
            register_client("fake-url", "", "", 1, {}, {}, {})
        # Assert
        expected = {
            "api.features": [
                ErrorDetails(
                    _type="exception",
                    message="unleash client feature fetch failed " "due to exception: %s",
                    exception=MissingSchema(
                        "Invalid URL 'fake-url/client/features': No scheme supplied. Perhaps you meant https://fake-url/client/features?"
                    ),
                )
            ],
            "api.metrics": [
                ErrorDetails(
                    _type="warning",
                    message="unleash client metrics submission " "failed due to exception: %s",
                    exception=MissingSchema(
                        "Invalid URL 'fake-url/client/metrics': No scheme supplied. Perhaps you meant https://fake-url/client/metrics?"
                    ),
                )
            ],
            "api.register": [
                ErrorDetails(
                    _type="exception",
                    message="unleash client registration failed " "fatally due to exception: %s",
                    exception=MissingSchema(
                        "Invalid URL 'fake-url/client/register': No scheme supplied. Perhaps you meant https://fake-url/client/register?"
                    ),
                )
            ],
        }
        self.assertEqual(expected, error_holder)

    def test_patch_fetch_and_load_features(self):
        # Arrange
        caller_holder = {}

        class CallableWrapper(wrapt.ObjectProxy):
            def __call__(self, *args, **kwargs):
                counter = caller_holder.get(self.__wrapped__.__name__, 0) + 1
                caller_holder[self.__wrapped__.__name__] = counter
                return self.__wrapped__(*args, **kwargs)

        unleash_client_module = __import__("UnleashClient")
        target_fetch_and_load_features = getattr(unleash_client_module, "fetch_and_load_features")
        setattr(unleash_client_module, "fetch_and_load_features", CallableWrapper(target_fetch_and_load_features))
        # Act
        UnleashClient("http://fake/api", "agrabah").initialize_client()
        # Assert
        self.assertTrue(caller_holder.get("fetch_and_load_features"))
        self.assertTrue(1, caller_holder["fetch_and_load_features"])

```

The code above uses *[wrapt](https://wrapt.readthedocs.io/en/latest/)*. It helps you create proxy objects. Take a look at [this sample code](https://github.com/open-telemetry/opentelemetry-python/blob/a5520e8d14fdc31416098d3dc147d500a6a29821/shim/opentelemetry-opencensus-shim/src/opentelemetry/shim/opencensus/_shim_span.py#L63) in Open Telemetry for Python. That's how it instruments your code.

I hope this may help you. See you 😄!
