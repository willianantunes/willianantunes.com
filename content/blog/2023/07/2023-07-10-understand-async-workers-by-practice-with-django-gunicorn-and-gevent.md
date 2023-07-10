---
id: 2a60e830-1eb2-11ee-96fd-dd213e007755
title: Understand Async Workers by Practice with Django, Gunicorn, and Gevent
date: 2023-07-09T23:41:45.933Z
cover: /assets/posts/blog-35-understand-async-workers-by-practice-with-django-gunicorn-and-gevent.png
description: Discover the power of async workers in Django applications using
  Gunicorn and Gevent through practical demonstrations. Docker Compose is
  everything you need.
tags:
  - django
  - gunicorn
  - gevent
  - concurrency
---
**Warning:** This is a note, so don't expect much 😅!

Before proceeding, let's quickly recap the technologies we're touching on:

* [Gunicorn](https://docs.gunicorn.org/en/latest/index.html): It's the web server. It implements [WSGI](https://peps.python.org/pep-0333/). It is literally an interface in object-oriented programming. To illustrate, the counterpart of it in Ruby is [Rack](https://github.com/rack/rack).
* [Gevent](https://www.gevent.org/intro.html#example): Generally speaking, it knows when you're executing blocking calls, then it can switch the execution to another job while the other is awaiting the blocking call to complete. In this context, a job is a [Greenlet](https://greenlet.readthedocs.io/en/latest/), and the switching among jobs is done by an event loop. Gevent knows about the blocking calls because it [makes the standard library cooperative](https://www.gevent.org/api/gevent.monkey.html) through [monkey patching](https://www.willianantunes.com/blog/2023/06/spy-on-python-objects-using-monkey-patching/). 

[This repository](https://github.com/calvinchengx/learngeventsocketio) is excellent for understanding the meaning of concurrency, parallelism, threads, and processes. Now, learning by practice with an actual project helps to consolidate what we learn. To do so, download the following project from GitHub:

* [Django Gunicorn Gevent](https://github.com/willianantunes/tutorials/tree/master/2023/07/django-gunicorn-gevent)

We'll use Compose services to explore different scenarios. Let's look at the [app service](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/docker-compose.yml#L52-L74C24):

```yaml
  app:
    build:
      context: .
    env_file: .env.development
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    # CHANGE THE SCRIPT TO AFFECT HOW THE LOAD BEHAVES!
    command: [ "./scripts/start-patch_almost_all.sh" ]
    # command: [ "./scripts/start-patch_all.sh" ]
    # command: [ "./scripts/start-patch_nothing.sh" ]
    depends_on:
      db:
        condition: service_healthy
      slow-service:
        condition: service_healthy
    healthcheck:
      test: [ "CMD", "python", "healthcheck.py" ]
      interval: 2s
      timeout: 1m
      retries: 5
      start_period: 10s
```

You can run the `app` service by using one of the commands:

* ***[start-patch_nothing.sh](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/scripts/start-patch_nothing.sh)***: The property `worker_class` is configured with the value `sync`.
* ***[start-patch_almost_all.sh](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/scripts/start-patch_almost_all.sh)***: The property `worker_class` is configured with the value `gevent` (look at [where the patch occurs](https://github.com/benoitc/gunicorn/blob/add8a4c951f02a67ca1f81264e5c107fa68e6496/gunicorn/workers/ggevent.py#L39))***.***
* ***[start-patch_all.sh](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/scripts/start-patch_all.sh)***: It uses `gevent` as `worker_class` and patches psycopg2 (know why [here](https://www.psycopg.org/docs/advanced.html#support-for-coroutine-libraries)). By the way, if you want to change it to psycopg3, you should be aware of [its limitations](https://github.com/psycopg/psycopg/issues/527#issuecomment-1478731035).

Let's look at the [send-load service](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/docker-compose.yml#L75-L89):

```yaml
  send-load:
    # https://github.com/rakyll/hey
    image: williamyeh/hey
    volumes:
      - .:/app
    entrypoint: [ "/bin/sh", "-ce" ]
    # CHANGE THE SCRIPT TO AFFECT HOW THE LOAD BEHAVES!
    command: [ "/app/scripts/load-database-call.sh" ]
    # command: [ "/app/scripts/load-http-and-database-calls.sh" ]
    # command: [ "/app/scripts/load-http-call.sh" ]
    # The following is supposed to be used with gevent worker
    # command: [ "/app/scripts/load-route-that-does-10-other-requests.sh" ]
    depends_on:
      app:
        condition: service_healthy
```

It uses [hey](https://github.com/rakyll/hey), an HTTP load generator. You can run the service by choosing one of the commands:

* ***[load-http-call.sh](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/scripts/load-http-call.sh)***: It calls a [route](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/django_gunicorn_gevent/apps/core/views.py#L18-L21) that executes a request to an external service. The service delays 1 second to answer.
* ***[load-database-call.sh](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/scripts/load-database-call.sh)***: It calls a [route](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/django_gunicorn_gevent/apps/core/views.py#L32-L37) that executes a database query that delays 1 second.
* ***[load-http-and-database-calls.sh](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/scripts/load-http-and-database-calls.sh)***: It calls a [route](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/django_gunicorn_gevent/apps/core/views.py#L40-L42) that uses both functions above.
* ***[load-route-that-does-10-other-requests.sh](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/scripts/load-route-that-does-10-other-requests.sh)***: It calls a [route](https://github.com/willianantunes/tutorials/blob/1c2d78f941dc514a2637f2f85ebfa90141cc6745/2023/07/django-gunicorn-gevent/django_gunicorn_gevent/apps/core/views.py#L24-L29) that executes a request to an external service 10 times.

Every command executes 10 requests simultaneously. Now that everything is settled let's observe how the application behaves 👀. Check out how each command impacts the output and the load testing report.

I hope this may help you. See you 😄!

## start-patch_nothing.sh / load-http-and-database-calls.sh

Output from the app:

```
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000353, "date": "[09/Jul/2023:18:39:39 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.693181, "date": "[09/Jul/2023:18:39:43 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.022099, "date": "[09/Jul/2023:18:39:46 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.022600, "date": "[09/Jul/2023:18:39:48 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.022275, "date": "[09/Jul/2023:18:39:50 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.021723, "date": "[09/Jul/2023:18:39:52 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.012852, "date": "[09/Jul/2023:18:39:54 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.018640, "date": "[09/Jul/2023:18:39:56 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.020057, "date": "[09/Jul/2023:18:39:58 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.018758, "date": "[09/Jul/2023:18:40:00 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.014579, "date": "[09/Jul/2023:18:40:02 +0000]"}
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000594, "date": "[09/Jul/2023:18:40:03 +0000]"}
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000344, "date": "[09/Jul/2023:18:40:05 +0000]"}
```

Output from send-load:

```
Summary:
  Total:	20.8776 secs
  Slowest:	20.8773 secs
  Fastest:	2.6951 secs
  Average:	11.7916 secs
  Requests/sec:	0.4790


Response time histogram:
  2.695 [1]	    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  4.513 [0]	    |
  6.332 [1]	    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  8.150 [1]	    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  9.968 [1]	    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  11.786 [1]    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  13.604 [1]    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  15.423 [1]    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  17.241 [1]    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  19.059 [1]    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  20.877 [1]    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


Latency distribution:
  10% in 4.7184 secs
  25% in 8.7659 secs
  50% in 12.8025 secs
  75% in 18.8620 secs
  90% in 20.8773 secs
  0% in 0.0000 secs
  0% in 0.0000 secs

Details (average, fastest, slowest):
  DNS+dialup:	0.0006 secs, 2.6951 secs, 20.8773 secs
  DNS-lookup:	0.0004 secs, 0.0002 secs, 0.0005 secs
  req write:	0.0001 secs, 0.0000 secs, 0.0008 secs
  resp wait:	11.7907 secs, 2.6936 secs, 20.8766 secs
  resp read:	0.0001 secs, 0.0001 secs, 0.0002 secs

Status code distribution:
  [200]	10 responses
```

## start-patch_almost_all.sh / load-http-and-database-calls.sh

Output from the app:

```
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000399, "date": "[09/Jul/2023:18:47:18 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.042871, "date": "[09/Jul/2023:18:47:19 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 3.065513, "date": "[09/Jul/2023:18:47:20 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 4.084941, "date": "[09/Jul/2023:18:47:21 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 5.102030, "date": "[09/Jul/2023:18:47:22 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 6.119062, "date": "[09/Jul/2023:18:47:23 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 7.129000, "date": "[09/Jul/2023:18:47:24 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 8.208998, "date": "[09/Jul/2023:18:47:25 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 9.162476, "date": "[09/Jul/2023:18:47:26 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 10.178988, "date": "[09/Jul/2023:18:47:27 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 11.192189, "date": "[09/Jul/2023:18:47:28 +0000]"}
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000272, "date": "[09/Jul/2023:18:47:28 +0000]"}
```

Output from send-load:

```
Summary:
  Total:	11.2518 secs
  Slowest:	11.2513 secs
  Fastest:	2.1064 secs
  Average:	6.6854 secs
  Requests/sec:	0.8887
  

Response time histogram:
  2.106 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  3.021 [0]     |
  3.935 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  4.850 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  5.764 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  6.679 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  7.593 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  8.508 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  9.422 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  10.337 [1]    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  11.251 [1]    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


Latency distribution:
  10% in 3.1311 secs
  25% in 5.1632 secs
  50% in 7.1954 secs
  75% in 10.2430 secs
  90% in 11.2513 secs
  0% in 0.0000 secs
  0% in 0.0000 secs

Details (average, fastest, slowest):
  DNS+dialup:	0.0008 secs, 2.1064 secs, 11.2513 secs
  DNS-lookup:	0.0006 secs, 0.0004 secs, 0.0010 secs
  req write:	0.0000 secs, 0.0000 secs, 0.0001 secs
  resp wait:	6.6844 secs, 2.1051 secs, 11.2503 secs
  resp read:	0.0001 secs, 0.0001 secs, 0.0001 secs

Status code distribution:
  [200]	10 responses
```

## start-patch_almost_all.sh / load-http-call.sh

Output from the app:

```
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000391, "date": "[09/Jul/2023:18:51:45 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "54", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.026137, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "60", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.020898, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "55", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.024442, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "68", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.031566, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "40", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.030961, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "43", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.027810, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "51", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.036921, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "61", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.040027, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "52", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.035063, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /only-http-call/ HTTP/1.1", "status": 200, "length": "53", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.032115, "date": "[09/Jul/2023:18:51:46 +0000]"}
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000393, "date": "[09/Jul/2023:18:51:48 +0000]"}
```

Output from send-load:

```
Summary:
  Total:	1.0443 secs
  Slowest:	1.0441 secs
  Fastest:	1.0280 secs
  Average:	1.0385 secs
  Requests/sec:	9.5761
  
  Total data:	537 bytes
  Size/request:	53 bytes

Response time histogram:
  1.028 [1]	|■■■■■■■■■■
  1.030 [0]	|
  1.031 [1]	|■■■■■■■■■■
  1.033 [1]	|■■■■■■■■■■
  1.034 [0]	|
  1.036 [0]	|
  1.038 [1]	|■■■■■■■■■■
  1.039 [0]	|
  1.041 [0]	|
  1.042 [2]	|■■■■■■■■■■■■■■■■■■■■
  1.044 [4]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


Latency distribution:
  10% in 1.0308 secs
  25% in 1.0365 secs
  50% in 1.0425 secs
  75% in 1.0435 secs
  90% in 1.0441 secs
  0% in 0.0000 secs
  0% in 0.0000 secs

Details (average, fastest, slowest):
  DNS+dialup:	0.0022 secs, 1.0280 secs, 1.0441 secs
  DNS-lookup:	0.0008 secs, 0.0005 secs, 0.0010 secs
  req write:	0.0001 secs, 0.0000 secs, 0.0001 secs
  resp wait:	1.0361 secs, 1.0264 secs, 1.0428 secs
  resp read:	0.0001 secs, 0.0000 secs, 0.0002 secs

Status code distribution:
  [200]	10 responses
```

## start-patch_almost_all.sh / load-database-call.sh

Output from the app:

```
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000370, "date": "[09/Jul/2023:18:54:04 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.009565, "date": "[09/Jul/2023:18:54:06 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.008241, "date": "[09/Jul/2023:18:54:07 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.014841, "date": "[09/Jul/2023:18:54:08 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.017363, "date": "[09/Jul/2023:18:54:09 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.036062, "date": "[09/Jul/2023:18:54:10 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.015181, "date": "[09/Jul/2023:18:54:11 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.014806, "date": "[09/Jul/2023:18:54:12 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.015249, "date": "[09/Jul/2023:18:54:13 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.015005, "date": "[09/Jul/2023:18:54:14 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.008514, "date": "[09/Jul/2023:18:54:15 +0000]"}
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000752, "date": "[09/Jul/2023:18:54:15 +0000]"}
```

Output from send-load:

```
Summary:
  Total:	10.1670 secs
  Slowest:	10.1668 secs
  Fastest:	1.0120 secs
  Average:	5.5916 secs
  Requests/sec:	0.9836
  

Response time histogram:
  1.012 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.927 [0]     |
  2.843 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  3.758 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  4.674 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  5.589 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  6.505 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  7.420 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  8.336 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  9.251 [1]     |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  10.167 [1]    |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


Latency distribution:
  10% in 2.0213 secs
  25% in 4.0558 secs
  50% in 6.1089 secs
  75% in 9.1569 secs
  90% in 10.1668 secs
  0% in 0.0000 secs
  0% in 0.0000 secs

Details (average, fastest, slowest):
  DNS+dialup:	0.0013 secs, 1.0120 secs, 10.1668 secs
  DNS-lookup:	0.0011 secs, 0.0005 secs, 0.0016 secs
  req write:	0.0001 secs, 0.0000 secs, 0.0001 secs
  resp wait:	5.5900 secs, 1.0102 secs, 10.1648 secs
  resp read:	0.0001 secs, 0.0000 secs, 0.0001 secs

Status code distribution:
  [200]	10 responses
```

## start-patch_all.sh / load-database-call.sh

Output from the app:

```
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000477, "date": "[09/Jul/2023:18:57:17 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.028506, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.028143, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.027812, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.028183, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.030837, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.029754, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.037536, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.037898, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.102683, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /only-database-call/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 1.038583, "date": "[09/Jul/2023:18:57:18 +0000]"}
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000447, "date": "[09/Jul/2023:18:57:19 +0000]"}
```

Output from send-load:

```
Summary:
  Total:	1.1053 secs
  Slowest:	1.1052 secs
  Fastest:	1.0944 secs
  Average:	1.0997 secs
  Requests/sec:	9.0469
  

Response time histogram:
  1.094 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.095 [0]	|
  1.097 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.098 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.099 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.100 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.101 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.102 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.103 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.104 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  1.105 [1]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


Latency distribution:
  10% in 1.0956 secs
  25% in 1.0978 secs
  50% in 1.1001 secs
  75% in 1.1039 secs
  90% in 1.1052 secs
  0% in 0.0000 secs
  0% in 0.0000 secs

Details (average, fastest, slowest):
  DNS+dialup:	0.0007 secs, 1.0944 secs, 1.1052 secs
  DNS-lookup:	0.0003 secs, 0.0002 secs, 0.0005 secs
  req write:	0.0001 secs, 0.0000 secs, 0.0003 secs
  resp wait:	1.0988 secs, 1.0934 secs, 1.1042 secs
  resp read:	0.0001 secs, 0.0000 secs, 0.0001 secs

Status code distribution:
  [200]	10 responses
```

## start-patch_all.sh / load-http-and-database-calls.sh

Output from the app:

```
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000563, "date": "[09/Jul/2023:18:59:45 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.097470, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.102433, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.107448, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.116170, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.118652, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.115425, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.115756, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.119482, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.126621, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /both-http-and-database-calls/ HTTP/1.1", "status": 200, "length": "0", "referer": "-", "user_agent": "hey/0.0.1", "time": 2.123396, "date": "[09/Jul/2023:18:59:47 +0000]"}
{"message": "GET /healthcheck/liveness HTTP/1.1", "status": 200, "length": "17", "referer": "-", "user_agent": "python-requests/2.31.0", "time": 0.000495, "date": "[09/Jul/2023:18:59:47 +0000]"}
```

Output from send-load:

```
Summary:
  Total:	2.1354 secs
  Slowest:	2.1352 secs
  Fastest:	2.1119 secs
  Average:	2.1259 secs
  Requests/sec:	4.6830
  

Response time histogram:
  2.112 [1]	|■■■■■■■■■■■■■
  2.114 [1]	|■■■■■■■■■■■■■
  2.117 [0]	|
  2.119 [0]	|
  2.121 [1]	|■■■■■■■■■■■■■
  2.124 [1]	|■■■■■■■■■■■■■
  2.126 [0]	|
  2.128 [1]	|■■■■■■■■■■■■■
  2.131 [0]	|
  2.133 [2]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■
  2.135 [3]	|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


Latency distribution:
  10% in 2.1131 secs
  25% in 2.1213 secs
  50% in 2.1306 secs
  75% in 2.1342 secs
  90% in 2.1352 secs
  0% in 0.0000 secs
  0% in 0.0000 secs

Details (average, fastest, slowest):
  DNS+dialup:	0.0045 secs, 2.1119 secs, 2.1352 secs
  DNS-lookup:	0.0041 secs, 0.0039 secs, 0.0043 secs
  req write:	0.0002 secs, 0.0000 secs, 0.0003 secs
  resp wait:	2.1212 secs, 2.1070 secs, 2.1304 secs
  resp read:	0.0001 secs, 0.0000 secs, 0.0001 secs

Status code distribution:
  [200]	10 responses
```
