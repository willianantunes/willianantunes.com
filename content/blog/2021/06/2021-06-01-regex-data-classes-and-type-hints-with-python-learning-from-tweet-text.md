---
id: 4f63e9f0-c2d6-11eb-b1c1-b5780a87df28
title: "RegEx, Data Classes and Type Hints with Python: Learning from tweet text"
date: 2021-06-01T12:38:47.699Z
cover: /assets/posts/blog-8-regex-data-classes-and-type-hints-with-python.png
description: Let's use the RE module and Data Classes to check if a given tweet
  text is valid to our fictional business rule. Type hints can help with gradual
  typing. Come!
tags:
  - gradual typing
  - regex
  - dataclasses
  - python
---
Before we jump into the code, let's first define our fictional business rule ✍:

* After the mention, the word "concedes" must be present. It is identified as the trigger keyword.
* After the keyword, at least one hashtag must be present. The tweet may contain more than one if the user wishes to.
* The hashtag must be written using [Upper Camel Case (also known as Pascal Case)](https://en.wikipedia.org/wiki/Camel_case) to identify as separate words to create slugs. For instance, `#VillainJafar` turns into `villain-jafar`.

Thus if we receive something like `@GenieOfTheLamp concedes #FirstWish #SecondWish` we should get two hashtags and their slugs: `first-wish` and `second-wish`, as well as if the tweet is valid or not.

## Starting from the test

It's pretty typical to start from the tests when you have a well-defined business rule. This approach of development is known as TDD. If we consider the sample given with `#VillainJafar`:

```python
def test_should_evaluate_text_as_valid_given_keyword_and_one_hashtag_presence():
    # Arrange
    sample_tweet = "@GenieOfTheLamp concedes #VillainJafar"
    # Act
    result = None
    # Assert
    assert result.is_valid
    assert result.hashtags == ["VillainJafar"]
    assert result.slugs == ["villain-jafar"]
```

We can also use the second one:

```python
def test_should_evaluate_text_as_valid_given_keyword_and_two_hashtags_presence():
    # Arrange
    sample_tweet = "@GenieOfTheLamp concedes #FirstWish #SecondWish"
    # Act
    result = None
    # Assert
    assert result.is_valid
    assert result.hashtags == ["FirstWish", "SecondWish"]
    assert result.slugs == ["first-wish", "second-wish"]
```

Now let's think in terms of flows that don't match what is expected. Some test cases that we can assert:

* The text is missing the keyword.
* The text has the wrong keyword.
* The text is none or empty.

We can write tests like the following:

```python
def test_should_evaluate_text_as_invalid_given_missing_keyword():
    # Arrange
    sample_tweet = "@GenieOfTheLamp #FirstWish #SecondWish"
    # Act
    result = None
    # Assert
    assert not result.is_valid


def test_should_evaluate_text_as_invalid_given_wrong_keyword():
    # Arrange
    sample_tweet = "@GenieOfTheLamp creates #FirstWish #SecondWish"
    # Act
    result = None
    # Assert
    assert not result.is_valid


def test_should_throw_exception_when_text_is_none_or_empty():
    # Arrange
    sample_tweet = "@GenieOfTheLamp creates #FirstWish #SecondWish"
    # Act and assert
    with pytest.raises(Exception):
        # Empty String case
        pass
    with pytest.raises(Exception):
        # None as an argument
        pass      
```

Let's jump into the concrete implementation! By the way, as you may have noticed, I'm using `pytest`, but you can see how it would be with `unittest` if you check [the repository](https://github.com/willianantunes/tutorials/blob/master/2021/06/regex-dataclasses-with-python-learning-from-tweet-text/tests/test_unittest_text_evaluator.py).

## Defining method contract using type hints and data classes

As you've seen in our tests, we didn't define our method contract. Let's start with the following:

```python
def check_text_and_grab_its_details(text: str):
    pass
```

We defined the argument's type, but what about the returned type? That's a good situation to use [Data Classes](https://docs.python.org/3/library/dataclasses.html#module-dataclasses)! From our tests, we know what the expected behavior is. Let's define our data class and use it and the returning type of our method:

```python
@dataclass(frozen=True)
class TextDetails:
    is_valid: bool
    hashtags: Optional[List[str]] = None
    slugs: Optional[List[str]] = None


def check_text_and_grab_its_details(text: str) -> TextDetails:
    pass
```

The defined data class has the parameter `Frozen` as true, which means that its instance will be read-only, and any assignment attempt to fields will generate an exception. [Learn more about Frozen Instances in Python's documentation](https://docs.python.org/3/library/dataclasses.html#frozen-instances). It was two fields as optional and with value none. It allows us to instantiate the data class like the following:

```python
TextDetails(True)
TextDetails(True, ["FirstWish"], ["first-wish"])
```

The method contract is adequate, thanks to [type hints](https://docs.python.org/3/library/typing.html#module-typing). We can take advantage of it and use `mypy` to guarantee all the methods contracts, but let's configure it in the end. Let's dive into our method's implementation first.

## Method implementation and the RE module

To have a valid regular expression, I used the site [RegExr](https://regexr.com/) to create it. If you don't know how it works, I recommend the book [Piazinho](https://www.amazon.com.br/dp/8575224743/). [The regex pattern](https://regexr.com/5u3m2) can be defined in our Python code like the following:

```python
regex_valid_text = re.compile(r".* ?@GenieOfTheLamp concedes ( ?#([a-zA-Z]{1,}))+$")
```

[The method compile](https://docs.python.org/3/library/re.html#re.compile) does the following according to Python documentation:

> Compile a regular expression pattern into a regular expression object, which can be used for matching using its match(), search() and other methods.

We'll use [another regex pattern](http://regexr.com/5u3m8) to transform our hashtag into a slug. We just need to identify the upper case letters, ignoring the first matched group to avoid inserting a dash at the beginning. Now that we have our regex expressions determined, it's essential to clean our text before running them. Wrapping everything up, here's our code so far:

```python
@dataclass(frozen=True)
class TextDetails:
    is_valid: bool
    hashtags: Optional[List[str]] = None
    slugs: Optional[List[str]] = None


regex_valid_text = re.compile(r".* ?@GenieOfTheLamp concedes ( ?#([a-zA-Z]{1,}))+$")
regex_camel_case_conversion = re.compile(r"(?!^)([A-Z]+)")


def check_text_and_grab_its_details(text: str) -> TextDetails:
    cleaned_text = strip_left_and_right_sides(text)

    if not cleaned_text:
        raise TextIsFalsyException
```

We'll use the methods [match](https://docs.python.org/3/library/re.html#re.Pattern.match), [findall](https://docs.python.org/3/library/re.html#re.Pattern.findall), and [sub](https://docs.python.org/3/library/re.html#re.Pattern.sub); they are all related to regex patterns. The first will check if the tweet is valid, the second will retrieve all matched hashtags with the help of [another regex pattern](https://regexr.com/5u59n), and the last one will replace a given match to a particular character; in our case, to transform the hashtag to slug. This is the final code:

```python
@dataclass(frozen=True)
class TextDetails:
    is_valid: bool
    hashtags: Optional[List[str]] = None
    slugs: Optional[List[str]] = None


pattern_valid_text = re.compile(r".* ?@GenieOfTheLamp concedes (#[a-zA-Z]{1,} ?)+$")
pattern_hashtags = re.compile(r"(#[a-zA-Z]{1,})")
pattern_camel_case_conversion = re.compile(r"(?!^)([A-Z]+)")


def check_text_and_grab_its_details(text: str) -> TextDetails:
    cleaned_text = strip_left_and_right_sides(text)

    if not cleaned_text:
        raise TextIsFalsyException

    match = pattern_valid_text.match(text)

    if not match:
        return TextDetails(False)

    all_hashtags = pattern_hashtags.findall(text)

    hashtags = []
    slugs = []

    for hashtag in all_hashtags:
        tag = hashtag.replace("#", "")
        almost_slug = pattern_camel_case_conversion.sub(r"-\1", tag)
        slug = almost_slug.lower()
        hashtags.append(tag)
        slugs.append(slug)

    return TextDetails(True, hashtags, slugs)
```

## Running the tests

We just need to replace the following snippets:

```python
# Act
result = None

# Act and assert
with pytest.raises(Exception):
    # Empty String case
    pass
with pytest.raises(Exception):
    # None as an argument
    pass      
```

With these:

```python
# Act
result = check_text_and_grab_its_details(sample_tweet)

# Act and assert
with pytest.raises(TextIsFalsyException):
    check_text_and_grab_its_details("")
with pytest.raises(AttributeError):
    check_text_and_grab_its_details(None)   
```

Now, if we run the tests 🚀:

![It shows a list of tests containing 5 test cases. All of them are running successfully.](/assets/posts/blog-8-image-1.png "All tests passing.")

## Bonus: static analysis with mypy

Nowadays, a production-ready Python project must have a static type checker. You can gradually type your project, then make it safer to work with and ship to your environment. One that you can use is `mypy`; what is it according to [the documentation](https://github.com/python/mypy#what-is-mypy):

> Mypy is an optional static type checker for Python. You can add type hints ([PEP 484](https://www.python.org/dev/peps/pep-0484/)) to your Python programs, and use mypy to type check them statically. Find bugs in your programs without even running them! You can mix dynamic and static typing in your programs. You can always fall back to dynamic typing when static typing is not convenient, such as for legacy code.

I've found many bugs with the help of `mypy` since I started using it two years ago, so let's make our project a bit better. Let's apply [black](https://github.com/psf/black) and [isort](https://github.com/PyCQA/isort) also. Here's the script to evaluate our project:

```shell
#!/usr/bin/env bash

TARGET_PROJECT=regex_dataclasses
TARGET_TEST_PROJECT=tests
TARGET_FOLDERS="$TARGET_PROJECT $TARGET_TEST_PROJECT"

echo "######## ISORT..."
isort $TARGET_FOLDERS --check-only --diff
echo "######## BLACK..."
black --check --diff $TARGET_FOLDERS
echo "######## MYPY..."
# mypy will only target the project folder
mypy $TARGET_PROJECT
```

If we run it, here's the output:

```shellsession
▶ ./scripts/start-lint.sh
######## ISORT...
######## BLACK...
All done! ✨ 🍰 ✨
7 files would be left unchanged.
######## MYPY...
Success: no issues found in 4 source files
(regex-dataclasses-with-python-learning-from-tweet-text)
```

## Conclusion

If you've been working with strong typing languages and dynamic ones for a time, once you start [gradually typing](https://en.wikipedia.org/wiki/Gradual_typing) projects, you'll notice how fast you can produce and deliver good quality code. Instead of typing everything, you can create types and apply them to important places on your code. It's been some years that I understood that 100% of pure dynamic code or typed one is a bad thing, depending, of course, in which context you are. Static type checkers enable Python projects to support gradual typing for our luck, and data classes are a fantastic way to help us with it. This technique must be used wisely, or more problems are brought up actually, though.

You can take a look at [the whole project on GitHub](https://github.com/willianantunes/tutorials/tree/master/2021/06/regex-dataclasses-with-python-learning-from-tweet-text) 🤟. By the way, how about if you modify `TextDetails` class? Perhaps you can create a dedicated data class to contain the hashtag and its slug and then produce a list of it. There are many ways! Try it out 😜!

Posted listening to [It's My Life, Talk Talk](https://youtu.be/cFH5JgyZK1I).