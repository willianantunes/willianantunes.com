---
id: a97c5410-6e3d-11eb-9fbe-31a4fdd703fc
title: Public and useful tool to understand phonetics
date: 2023-08-29T20:50:19.016Z
cover: /assets/posts/blog-37-tools-rave-of-phonetics.png
description: Know where this site came from, how it was built, and understand
  how a problem faced by a person can be translated into a tool that everyone
  can use.
tags:
  - english
  - phonetics
  - pronunciation
---
**Important notice**: I wrote this blog entry on [February 19, 2021](https://github.com/willianantunes/rave-of-phonetics/blob/c79814d83887c57408de32984a80634e4ddada93/frontend/content/blog/2021/02/2021-02-19-public-and-useful-tool-to-understand-phonetics.md). It was available on Rave of Phonetics website. It is offline but Rave of Phonetics in open-source now. [Check it out](https://github.com/willianantunes/rave-of-phonetics/) 😀.

Have you ever used a tool or program that worked for you, yet you felt that there was something missing? It was handy, but maybe it lacked some features that would make things a lot easier for you and everyone else using it. That was exactly my situation.

## The issue I faced and pronouncing through phonetics

Months ago, I started learning English intensively. One platform that I have been using a lot is Cambly. There you can find native English speakers to talk about everything you want, and when you find a good tutor, the learning process is accelerated greatly. I think this as important as any part of your immersive approach to learning a new language. I met a tutor, who is, by the way, my partner here at Rave of Phonetics, and he taught me an interesting way of gradually understanding how to improve my speaking through phonetics. I was amazed with that!

To illustrate one situation, I was pronouncing ‘*chew*’ instead of ‘*to*’, all the time! To be honest, I was always pronouncing ‘*chew*’, not only for ‘*to*’, but for ‘*too*’ and ‘*two*’. Pretty quickly he noticed my problem and explained me how to pronounce it correctly. To do that, he used some tools specifically used for my situation and that was the moment I was again amazed; not in a good way, rather amazed of the deficiency of the tools. I realized that there were many phonetic transcription sites, but they did not have even the most basic of features. For example:

* No history of previously queried words.
* No looping of speech audio to repeat the word or phrase.
* No sharing of links to your friends and contacts through WhatsApp, WeChat, Telegram, Messenger, and others.
* No off-line functionally.

## Solving a problem and creating a public tool

Being a developer, something like the mason of the internet has its benefits. From time to time, I will take on a challenge and publicly share its code on my GitHub profile, like [this one](https://github.com/willianantunes/runner-said-no-one-ever) made in Ruby a time ago. The moment had come to do that yet again, so that’s when I saw the opportunity to change the game with a new tool that would help me (and you) to learn better through phonetics! Hence, I did the first version of Rave of Phonetics and I made it publicly available in January of 2021 (check the [changelog](/changelog) so you can see more details). After that day, I have not stopped improving it! The image below shows how many [commits](https://en.wikipedia.org/wiki/Commit_(version_control)) I have on the repository:

![GitHub repository of the Rave of Phonetics project](/assets/posts/blog-37-github-refactor-rop.png "A monorepo of the entire project")

## Technologies used

I started the project using [Django](https://www.djangoproject.com/) and [Parcel](https://parceljs.org/), but now the whole architecture is changed. [Gatsby](https://www.gatsbyjs.com/) is used for front-end with [Material UI](https://material-ui.com/) and I am still using Django for the back-end, because, as you may know, it is the web framework for perfectionists with deadlines. By the way, I’m still using others like [Inkscape](https://inkscape.org/):

![Print screen of Inkscape program](/assets/posts/blog-37-inkscape-rop.png "Inkscape can be used to draw things")

Let's build something together! Feedbacks and comments are welcome!
