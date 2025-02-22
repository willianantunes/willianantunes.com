---
id: 13358610-f12a-11ef-9fe2-3d8a068ebd0b
title: "Prevent Message Loss in RabbitMQ: Learn Alternate Exchanges by practice"
date: 2025-02-22T14:34:08.740Z
cover: /assets/posts/blog-48-prevent-message-loss-in-rabbitmq-learn-alternate-exchanges-by-practice.png
description: Explore RabbitMQ Alternate Exchanges with real examples and learn
  how to build more robust messaging systems
tags:
  - rabbitmq
  - amqp
  - pika
---
CloudAMQP has a very interesting [diagnostics tool](https://www.cloudamqp.com/docs/cloudamqp-diagnostics.html#all-published-messages-are-routed-successfully). It informs you if how you deal with your broker is healthy or not, and it gives you suggestions for things to improve. One crucial rule to pay attention to is that [all published messages are routed successfully](https://www.cloudamqp.com/docs/cloudamqp-diagnostics.html#all-published-messages-are-routed-successfully). If your system is complex, it might be challenging to identify which application is sending messages without routing, causing the message to be discarded. To avoid that, we can use [Alternate Exchange](https://www.rabbitmq.com/docs/ae). Let's learn it by practice? Download [this project](https://github.com/willianantunes/tutorials/tree/master/2025/02/rabbitmq-alternate-exchange-policy) and execute the following:

```shell
docker compose up create-alternate-exchange
```

[The script creates a policy, followed by the alternate exchange, a queue, and its binding](https://github.com/willianantunes/tutorials/blob/bc9f7d07d397e748d2806f4ee7668debd9f4531c/2025/02/rabbitmq-alternate-exchange-policy/configure_alternate_exchange.py#L146-L159). It creates 4 exchanges, though these two are the ones we should pay attention:

![Two exchanges are highlighted: unrouted.xpto.exchange, and xpto.exchange. It image highlights the applied policy.](/assets/posts/blog-48-asset-1-exchanges.png "All exchanges.")

The exchange named `xpto.exchange` is the one the application uses in production to send messages to. The `unrouted.xpto.exchange` is the alternate exchange for it. Now execute the following:

```shell
docker compose up publish-messages-indefinitely
```

[It publishes to the exchange `xpto.exchange` using the routing key `order_created`](https://github.com/willianantunes/tutorials/blob/bc9f7d07d397e748d2806f4ee7668debd9f4531c/2025/02/rabbitmq-alternate-exchange-policy/test_publisher.py#L54). You'll see the queue `listener.xpto.exchange` receiving messages:

![The queue `listener.xpto.exchange` is highlighted. It has 224 messages and continues receiving more messages.](/assets/posts/blog-48-asset-2-queues.png "Created queues.")

Let's delete this queue. The idea is to force the messages to be routed to the alternate exchange. Open another terminal and now execute the following:

```shell
docker compose up delete-queue
```

Now are the published messages are being routed to the queue `listener.unrouted.xpto.exchange`.

![The queue `listener.xpto.exchange` has been deleted, now the queue `listener.unrouted.xpto.exchange` is receiving the messages.](/assets/posts/blog-48-asset-3-unrouted-queue.png "The queue bound to the alternate exchange.")

I hope this may help you. See you! 😄