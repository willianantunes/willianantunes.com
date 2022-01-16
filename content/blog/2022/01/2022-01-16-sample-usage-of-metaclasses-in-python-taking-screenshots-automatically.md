---
id: e0412520-771f-11ec-a572-b542a61a4efc
title: "Sample usage of Metaclasses in Python: Taking screenshots automatically"
date: 2022-01-16T22:58:53.313Z
cover: /assets/posts/blog-14-sample-usage-of-metaclasses-in-python-taking-screenshots-automatically.png
description: If something is repeatable, then it's eligible in some cases to be
  abstracted. How about screenshots during functional testing?
tags:
  - python
  - proxy pattern
---
Python is a very versatile programming language. So, instead of doing this all the time to measure time execution of a given logic:

```python
class MyPageSample:
    def show_my_profile(self):
        start = time.perf_counter()
        try:
            # Main logic
            for i in range(1, 100):
                pass
            # End of main logic
        finally:
            elapsed = time.perf_counter() - start
            logger.info(f"show_my_profile took {elapsed:0.2f} seconds")
```

It can be translated to:

```python
class MyPageSample:
    @measure_it
    def show_my_profile(self):
        for i in range(1, 100):
            pass
```

Did you see `@measure_it`? It's known as a [decorator](https://realpython.com/primer-on-python-decorators/). Let's see its implementation:

```python
import logging
import time
from functools import wraps

logger = logging.getLogger(__name__)


def measure_it(func):
    @wraps(func)
    def timed(*args, **kw):
        start = time.perf_counter()
        try:
            return func(*args, **kw)
        finally:
            elapsed = time.perf_counter() - start 
            logger.info(f"{func.__name__} from {func.__module__} with args {args} took {elapsed:0.2f} seconds")

    return timed
```

## The problem

Now imagine we have the following class, and each method that starts with `step_` should take a screenshot by the end of its execution. So, according to the example above, we would have the following:

```python
class MyPageXYZSampleBad:
    @take_screenshot
    def step_access_home_page(self):
        pass

    @take_screenshot
    def step_access_ticker_panel(self):
        pass

    @take_screenshot
    def step_select_ticker(self, ticker_name: str):
        pass

    @take_screenshot
    def step_access_my_profile(self):
        pass
```

How can we avoid decorating methods all the time?

## Getting to know proxy design pattern

[This article](https://en.wikipedia.org/wiki/Proxy_pattern) on Wikipedia explains pretty well what it is. By the way, if you know about the same concept in networking, it works pretty much the same. [So an implicit or transparent proxy is a great example](https://docs.microsoft.com/en-us/previous-versions/windows/desktop/dd874788(v=vs.85)) to grab the idea:

![The user executes something, but in the background something more is being executed and may impact what he receives, even though he's not aware of it.](/assets/posts/blog-14-order-1-image-1-proxy-illustration.png "Proxy pattern.")

To achieve the same level of experience in our class, it would have to be like this:

```python
class MyPageXYZSample:
    def step_access_home_page(self):
        pass

    def step_access_ticker_panel(self):
        pass

    def step_select_ticker(self, ticker_name: str):
        pass

    def step_acess_my_profile(self):
        pass
```

But how do we do it in Python, though? Is there an API for that?

## Metaclasses in action

I want to show you how it works in actual code. So you can always look at [the official documentation for more details](https://docs.python.org/3/reference/datamodel.html#metaclasses) or [this lovely answer on Stack Overflow](https://stackoverflow.com/a/6581949/3899136). That said, what we want to do is:

* If a method starts with `step_`, a screenshot should be taken after its execution.
* If the screenshot fails for some reason, an exception should inform why.

This is our `take_screenshot` decorator:

```python
import logging

from functools import wraps

logger = logging.getLogger(__name__)


def take_screenshot(func):
    @wraps(func)
    def wrapped(*args, **kw):
        result = func(*args, **kw)
        try:
            logger.info(f"Screenshot has been taken for {func.__name__}")
        except Exception as e:
            raise FailedToTakeScreenshotException
        return result

    return wrapped


class FailedToTakeScreenshotException(Exception):
    pass
```

It just logs a message in `stdout`. As always, if you know the rules about something upfront, [it's a good idea to start with tests even though you don't know how to implement them](https://en.wikipedia.org/wiki/Test-driven_development). So this is our test class:

```python
import unittest

from unittest import mock

from python_metaclass.decorators import FailedToTakeScreenshotException
from python_metaclass.pages.page_xyz_good import MyPageXYZSample


class MyPageXYZSampleTests(unittest.TestCase):
    @mock.patch("python_metaclass.decorators.logger")
    def test_should_take_screenshots_when_required(self, mocked_logger):
        # Arrange
        my_page_sample_instance = MyPageXYZSample()
        # Act
        my_page_sample_instance.step_access_home_page()
        my_page_sample_instance.step_access_ticker_panel()
        my_page_sample_instance.step_select_ticker("cogn3")
        my_page_sample_instance.step_access_my_profile()
        my_page_sample_instance.do_not_take_screenshot()
        # Assert
        mocked_info = mocked_logger.info
        self.assertEqual(4, mocked_info.call_count)
        messages = []
        for call_arg in mocked_logger.info.call_args_list:
            first_argument = call_arg[0][0]
            messages.append(first_argument)
        expected_messages = [
            "Screenshot has been taken for step_access_home_page",
            "Screenshot has been taken for step_access_ticker_panel",
            "Screenshot has been taken for step_select_ticker",
            "Screenshot has been taken for step_access_my_profile",
        ]
        self.assertEqual(expected_messages, messages)

    @mock.patch("python_metaclass.decorators.logger")
    def test_should_raise_exception_given_take_screenshot_fails(self, mocked_logger):
        # Arrange
        mocked_info = mocked_logger.info
        mocked_info.side_effect = [None, Exception]
        my_page_sample_instance = MyPageXYZSampleGood()
        # Act and assert
        with self.assertRaises(FailedToTakeScreenshotException):
            my_page_sample_instance.step_access_home_page()
            my_page_sample_instance.step_access_my_profile()
        self.assertEqual(2, mocked_info.call_count)
```

So far, so good. Now, let's follow the official documentation to understand what we can do to create our proxy. By the way, I don't know why [Python 3 documentation](https://docs.python.org/3/reference/datamodel.html#customizing-class-creation) lacks a clear example, [as we have in Python 2 one](https://docs.python.org/2.7/reference/datamodel.html#customizing-class-creation). After a bit of debugging (and I recommend you that), that's how the `metaclass` is:

```python
from python_metaclass.decorators import take_screenshot


class BasePageMetaClass(type):
    def __new__(cls, subclass_name, bases, dictionary):
        for attribute in dictionary:
            value = dictionary[attribute]
            should_be_decorated_with_screenshot = attribute.startswith("step_") and callable(value)
            if should_be_decorated_with_screenshot:
                dictionary[attribute] = take_screenshot(value)
        return type.__new__(cls, subclass_name, bases, dictionary)
```

To use it, you should follow a contract, and [you can also check it in the documentation](https://docs.python.org/3/reference/datamodel.html#special-method-lookup). Then that's how it is:

```python
class MyPageXYZSample(object, metaclass=BasePageMetaClass):
    def step_access_home_page(self):
        pass

    def step_access_ticker_panel(self):
        pass

    def step_select_ticker(self, ticker_name: str):
        pass

    def step_access_my_profile(self):
        pass

    def do_not_take_screenshot(self):
        pass
```

If you run the test now, it should pass just fine 🙂.

## Conclusion

The issue I described here is quite common and typical in frameworks. [If you want to look at this in action, just look at this code](https://github.com/willianantunes/tutorials/tree/master/2021/11/sso-cognito-authorization-code-grant-type/functional_testing). Are you in need of intercepting something and changing the behavior without impacting the user? The proxy pattern is a great choice! I'm used to analyzing something with "lessons learned" or "best practices" on Google, which can also be applied to this problem. So even if you hadn't ever heard of the proxy pattern or metaclasses before this article, sooner or later, you would have heard about it. For example, I had to create a proxy to switch between reader and writer databases in Java a long time ago. My team came up with [a solution written natively in the language](https://docs.oracle.com/javase/8/docs/api/java/lang/reflect/Proxy.html). Unfortunately, we didn't know the proper name (proxy pattern) until we faced the real problem. Depending on which programming language you're using, there are many possibilities to achieve what we did here, even in Python.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/01/python-metaclasses).

Posted listening to [Donkey Kong Country 2: Hot-Head Bop](https://www.youtube.com/watch?v=goKKrHTlWhw&t=695s) 🎶.
