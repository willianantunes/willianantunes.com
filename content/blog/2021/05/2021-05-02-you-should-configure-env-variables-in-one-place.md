---
id: 6f7644c0-ab4f-11eb-b945-03b63716b7ce
title: You should configure env variables in one place
date: 2021-05-02T14:05:22.670Z
cover: /assets/posts/blog-2-you-should-configure-env-variables-in-one-place.png
description: Increased cognitive load can have a considerable impact on the
  ongoing of a project. Know how to minimize it a bit through one simple
  approach with environment variables.
tags:
  - defensive programming
  - javascript
---
Recently I had to create a new JavaScript project. I chose a framework and some libraries that I haven't used before. First, I tried to find lessons learned and projects on GitHub targeting the tools I decided on and then use them as a way to create my own project. Suddenly, I noticed a problem in all examples and even in big projects: they had `process.env` been invoked in many different files.

This approach may be seen as harmless because it's relatively trivial and works; nevertheless, isn't it better to help people who get in touch if your project regarding its settings right away?

## Explicit is better than implicit

When you are learning Python, sooner or later, you will face [The Zen of Python](https://www.python.org/dev/peps/pep-0020/). To give you an idea, if you've ever had to deal with projects where many developers were involved, you will probably sympathize with the statements contained in this easter egg. I use them as a means to endorse some practices in this article.

One of its statements is exactly *explicit is better than implicit*. Never, ever expect that somebody will understand your intentions, try to always leave this in doubt. To illustrate, if your team is growing, including people who have never programmed with the targeted language or framework, one of your concerns should be reducing cognitive load across projects. There are many ways to minimize this impact. One is creating a place where all your environment variables are defined. Let's see an example in the following image.

![There is one kind of getting values of environment variables, but you can compare with another one, that can be better.](/assets/posts/blog-2-image-1.png "One approach versus another.")

Instead of searching which files have `process.env`, we can simply look at the `settings.js` file and then understand what the application needs to run correctly.

## Readability counts, and a lot

This is another statement of the zen. Having all your environment variables in one place counts a lot. That is easy for someone with minimal "domain context" to read and quickly understand what your application does. As a result, it's pretty simple to statically find where the variables are being used. You can do that with `process.env` as well. Still, you would have trouble adding some spices to protect you from problems across many files. Let's see one ahead.

## Errors should never pass silently

Let's say the variables `PARTNER_API_ENDPOINT` and `ACTIVE_MQ_HOST` must be present in production, and then you forgot to add them, but your application can still be built. Can you imagine the problem that you would have when it's identified because of customer complaints? Let' solve that:

```javascript
function getEnvOrRaiseException(envName, defaultValue = null) {
  const value = process.env[envName]

  if (!value && defaultValue === null) throw new EnvironmentError(`Environment variable ${envName} is not set!`)
  if (!value && defaultValue !== null) return defaultValue

  return value
}

function evalEnvAsBoolean(envName, defaultValue = false) {
  const value = process.env[envName]

  if (!value && defaultValue) return defaultValue
  if (!value) return defaultValue

  const valueAsLowerCase = value.toLowerCase()
  const trueValues = ["true", "t", "y", "yes", "1"]
  return trueValues.includes(valueAsLowerCase)
}

const PARTNER_API_ENDPOINT = getEnvOrRaiseException("PARTNER_API_ENDPOINT")
const ACTIVE_MQ_HOST = getEnvOrRaiseException("ACTIVE_MQ_HOST")
const DATABASE_USE_SSL = evalEnvAsBoolean("DATABASE_USE_SSL", true)

export { PARTNER_API_ENDPOINT, ACTIVE_MQ_HOST, DATABASE_USE_SSL }

```

What about now? It can simply break your pipeline during build time. Your project will never advance to production without the required environment variables again. Is something unexpected? Throw an exception 😉

## Now is better than never

How about trying to use some of the zen statements in your work or even in your life? By the way, *now is better than never* is another declaration that I took from it. See you next time!