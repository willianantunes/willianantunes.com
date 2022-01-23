---
id: b0e38620-7c7d-11ec-b6da-aba0ac7e16be
title: Using transactions with STOMP with the help of Django STOMP
date: 2022-01-23T19:14:01.864Z
cover: /assets/posts/blog-15-using-transactions-with-stomp-with-the-help-of-django-stomp.png
description: Learn how protocols work through tests. How about transactions with
  STOMP? Let's create a test project where you can explore it!
tags:
  - stomp
  - django
  - tests
  - transactions
  - rabbitmq
  - python
---
[Django STOMP](https://github.com/juntossomosmais/django-stomp) is an excellent library for working with message brokers in Python. It has an opinionated way of dealing with things that can make the development of product features faster and more secure. To point out some:

* Correlation between messages as they travel through destinations.
* Automatic NACK operation if an exception is raised during a routine.
* Implementation of virtual topics which can be used either on ActiveMQ or RabbitMQ. Thanks to how [the STOMP plugin](https://www.rabbitmq.com/stomp.html) works, [it can be applied to the latter](https://github.com/juntossomosmais/django-stomp/commit/ea03c67a28258ae50c5fa2bc716a359f4fa9168b).
* All queues are configured as durable. Each queue has its DLQ.
* All messages are durable by default. [You can change the behavior by changing the persistent argument](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/django_stomp/services/producer.py#L67).
* Outstanding user experience to work with [consumers](https://github.com/juntossomosmais/django-stomp/tree/65e7cb86f8f6e2336a2739df8f33f985c9b4c792#consumer) and producers.

By the way, If you don't know what a `destination` is, I recommend looking at the [STOMP specification](https://stomp.github.io/stomp-specification-1.2.html#Protocol_Overview). It explains not only about this but other details about the protocol itself. For instance, it describes [how to begin a transaction](https://stomp.github.io/stomp-specification-1.2.html#BEGIN) and end it either with [commit](https://stomp.github.io/stomp-specification-1.2.html#COMMIT) or [abort](https://stomp.github.io/stomp-specification-1.2.html#ABORT). So the question is, how can we see it in action using Django STOMP? 🤔

## Describing the scenarios

We'll have a fake business rule. The application will have to create two events given a message it receives. The image below describes the first scenario, which is the happy one:

![Scenario 1 depicts a happy flow where everything works as expected, including the STOMP transaction.](/assets/posts/blog-15-order-1-image-1-scenario-1-description.png "Scenario 1.")

The second scenario shows a problem that happens during the dispatch of the second event to the ACME destination:

![Scenario 2 represents a flow where an exception happens when a published tries to send a message to the ACME destination.](/assets/posts/blog-15-order-2-image-2-scenario-2-description.png "Scenario 2")

Then the last scenario describes a simple error inside the function responsible for the computation:

![Scenario 3 depicts a flow where an exception is raised during the computation that created 2 events for ACME and XYZ.](/assets/posts/blog-15-order-3-image-3-scenario-3-description.png "Scenario 3.")

It's worth mentioning the expected results for each scenario:

* **Scenario 1:** The consumer marks the message as ACK and publishes two events. One message for the XYZ destination and another one for the ACME destination.
* **Scenario 2:** The publisher cancels the transaction. [Django STOMP catches the exception and calls NACK, sending the message to the DLQ](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/django_stomp/execution.py#L77-L83).
* **Scenario 3:** Django STOMP does the same as above, sending the message to the DLQ.

### The actual code about the business rule

So for this business rule:

![The image shows where the flow starts. First, a message is sent to a queue. Then is consumed by the callback function. It creates 2 events and dispatches them to XYZ and ACME destinations.](/assets/posts/blog-15-order-4-image-4-normal-flow.png "Business flow in an image.")

Let's use this code:

```python
import logging

from typing import Tuple

from django_stomp.builder import build_publisher
from django_stomp.services.consumer import Payload

logger = logging.getLogger(__name__)

xyz_destination = "/queue/xyz"
acme_destination = "/queue/acme"


def retrieve_events_to_be_dispatched(message: dict) -> Tuple[dict, dict]:
    event_to_xyz = {
        "who_did_the_thing_id": message["owner_id"],
        "title": message["title"],
    }
    event_to_acme = {
        "who_did_the_thing_id": message["owner_id"],
        "is_salt_addicted": message["salt_addicted"],
        "registered_at": message["registered_at"],
    }
    return event_to_xyz, event_to_acme


def build_news_and_dispatch_them(payload: Payload):
    """
    Payload body example:
    {
        "owner_id": "dcf6e27d-9331-406e-9bc2-ce973a761dfd",
        "title": "All right, so I'm back in high school, standing in the middle of the cafeteria",
        "salt_addicted": True,
        "registered_at": "2022-01-22T19:07:16.979"
    }
    """
    # Never do this in real production code. I did this just for the sake of the article.

    logger.debug("Creating messages to XYZ and ACME")
    message_to_xyz, message_to_acme = retrieve_events_to_be_dispatched(payload.body)

    logger.debug("Let's inform XYZ and ACME")
    publisher = build_publisher("news")
    with publisher.auto_open_close_connection(), publisher.do_inside_transaction():
        publisher.send(message_to_xyz, xyz_destination)
        publisher.send(message_to_acme, acme_destination)

    logger.debug("All the events have been sent")
    payload.ack()
```

Some explanations:

* The `build_publisher` function creates a producer for us. It has an opinionated way of [configuring it](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/django_stomp/builder.py#L45-L78) and [building it](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/django_stomp/services/producer.py#L212-L229).
* The `auto_open_close_connection` context manager will guarantee that our [publisher is gracefully closed](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/django_stomp/services/producer.py#L184-L191).
* The `do_inside_transaction`context manager allows us to create a block of code within which the transaction on the broker is guaranteed. [If the code block is successfully completed, the changes are committed to the broker. If there is an exception, the changes are canceled](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/django_stomp/services/producer.py#L193-L209).

## Writing the tests

To understand what we're going to do, it's necessary to check [how a callback function is imported by Django Stomp](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/django_stomp/execution.py#L44). Unfortunately, that means we can't apply mocks following the typical way. There is a trick that we can use, though. This is the test of our scenario 1:

```python
import logging

from uuid import uuid4

from django.utils import timezone
from django_stomp.execution import start_processing

from tests.support.caplog_helper import wait_for_message_in_log
from tests.support.django_stomp_helpers import get_latest_message_from_destination_using_test_listener
from tests.support.django_stomp_helpers import publish_to_destination
from tests.transactions_with_django_stomp.change_callback_do_the_thing import callback_scenario_1

xyz_destination = "/queue/xyz"
acme_destination = "/queue/acme"


def test_should_publish_events_in_two_queues_scenario_1(caplog):
    # Arrange
    caplog.set_level(logging.DEBUG)
    some_destination = f"scenario-1-{uuid4()}"
    sample_body = {
        "owner_id": uuid4(),
        "title": "All right, so I'm back in high school, standing in the middle of the cafeteria",
        "salt_addicted": True,
        "registered_at": timezone.now(),
    }
    publish_to_destination(some_destination, sample_body)
    # Act
    custom_uuid_for_destination = uuid4()
    extra_options = {"is_testing": True, "return_listener": True, "param_to_callback": custom_uuid_for_destination}
    message_consumer = start_processing(some_destination, callback_scenario_1, **extra_options)
    wait_for_message_in_log(caplog, r"All the events have been sent")
    message_consumer.close()
    # Assert
    final_xyz_destination = f"{xyz_destination}-scenario-1-{custom_uuid_for_destination}"
    final_acme_destination = f"{acme_destination}-scenario-1-{custom_uuid_for_destination}"
    message_from_xyz = get_latest_message_from_destination_using_test_listener(final_xyz_destination)
    message_from_acme = get_latest_message_from_destination_using_test_listener(final_acme_destination)
    assert message_from_xyz.body == {
        "who_did_the_thing_id": str(sample_body["owner_id"]),
        "title": sample_body["title"],
    }
    assert message_from_acme.body == {
        "who_did_the_thing_id": str(sample_body["owner_id"]),
        "is_salt_addicted": sample_body["salt_addicted"],
        "registered_at": sample_body["registered_at"].isoformat(timespec="milliseconds"),
    }
```

The variable `callback_scenario_1` points to a dotted module path. Here's the code:

```python
from unittest import mock

from transactions_with_django_stomp import do_the_thing
from transactions_with_django_stomp.do_the_thing import build_news_and_dispatch_them

callback_scenario_1 = "tests.transactions_with_django_stomp.change_callback_do_the_thing.build_news_and_dispatch_them_mocked"


def build_news_and_dispatch_them_mocked(payload, append_to_destination):
    # Change destinations so we can retrieve them during tests
    with mock.patch.object(do_the_thing, "xyz_destination", f"/queue/xyz-scenario-1-{append_to_destination}"):
        with mock.patch.object(do_the_thing, "acme_destination", f"/queue/acme-scenario-1-{append_to_destination}"):
            # Let's call our main callback function!
            build_news_and_dispatch_them(payload)
```

Did you notice the maneuver? This callback function is responsible for patching objects and changing behavior if needed. So, let's see all the test scenarios:

```python
import logging

from uuid import uuid4

from django.utils import timezone
from django_stomp.execution import start_processing

from tests.support.caplog_helper import wait_for_message_in_log
from tests.support.django_stomp_helpers import get_latest_message_from_destination_using_test_listener
from tests.support.django_stomp_helpers import publish_to_destination
from tests.transactions_with_django_stomp.change_callback_do_the_thing import callback_scenario_1
from tests.transactions_with_django_stomp.change_callback_do_the_thing import callback_scenario_2
from tests.transactions_with_django_stomp.change_callback_do_the_thing import callback_scenario_3

xyz_destination = "/queue/xyz"
acme_destination = "/queue/acme"


def test_should_publish_events_in_two_queues_scenario_1(caplog):
    # Arrange
    caplog.set_level(logging.DEBUG)
    some_destination = f"scenario-1-{uuid4()}"
    sample_body = {
        "owner_id": uuid4(),
        "title": "All right, so I'm back in high school, standing in the middle of the cafeteria",
        "salt_addicted": True,
        "registered_at": timezone.now(),
    }
    publish_to_destination(some_destination, sample_body)
    # Act
    custom_uuid_for_destination = uuid4()
    extra_options = {"is_testing": True, "return_listener": True, "param_to_callback": custom_uuid_for_destination}
    message_consumer = start_processing(some_destination, callback_scenario_1, **extra_options)
    wait_for_message_in_log(caplog, r"All the events have been sent")
    message_consumer.close()
    # Assert
    final_xyz_destination = f"{xyz_destination}-scenario-1-{custom_uuid_for_destination}"
    final_acme_destination = f"{acme_destination}-scenario-1-{custom_uuid_for_destination}"
    message_from_xyz = get_latest_message_from_destination_using_test_listener(final_xyz_destination)
    message_from_acme = get_latest_message_from_destination_using_test_listener(final_acme_destination)
    assert message_from_xyz.body == {
        "who_did_the_thing_id": str(sample_body["owner_id"]),
        "title": sample_body["title"],
    }
    assert message_from_acme.body == {
        "who_did_the_thing_id": str(sample_body["owner_id"]),
        "is_salt_addicted": sample_body["salt_addicted"],
        "registered_at": sample_body["registered_at"].isoformat(timespec="milliseconds"),
    }


def test_should_send_message_to_dlq_scenario_2(caplog):
    # Arrange
    caplog.set_level(logging.DEBUG)
    some_destination = f"scenario-2-{uuid4()}"
    sample_body = {
        "owner_id": uuid4(),
        "title": "You're feeling a lot of pain right now. You're angry. You're hurting. Can' I tell you what the answer is?",
        "salt_addicted": True,
        "registered_at": timezone.now(),
    }
    publish_to_destination(some_destination, sample_body)
    # Act
    custom_uuid_for_destination = uuid4()
    extra_options = {"is_testing": True, "return_listener": True, "param_to_callback": custom_uuid_for_destination}
    message_consumer = start_processing(some_destination, callback_scenario_2, **extra_options)
    wait_for_message_in_log(caplog, r"Trying to do NACK explicitly sending the message to DLQ.*")
    message_consumer.close()
    # Assert
    some_destination_dlq = f"/queue/DLQ.{some_destination}"
    message_from_dlq = get_latest_message_from_destination_using_test_listener(some_destination_dlq)
    assert message_from_dlq.body == {
        "owner_id": str(sample_body["owner_id"]),
        "title": sample_body["title"],
        "salt_addicted": sample_body["salt_addicted"],
        "registered_at": sample_body["registered_at"].isoformat(timespec="milliseconds"),
    }


def test_should_send_message_to_dlq_scenario_3(caplog):
    # Arrange
    caplog.set_level(logging.DEBUG)
    some_destination = f"scenario-3-{uuid4()}"
    sample_body = {
        "owner_id": uuid4(),
        "title": "I don't want to be single, OK?! I just... I just wanna be married again!",
        "salt_addicted": False,
        "registered_at": timezone.now(),
    }
    publish_to_destination(some_destination, sample_body)
    # Act
    extra_options = {"is_testing": True, "return_listener": True}
    message_consumer = start_processing(some_destination, callback_scenario_3, **extra_options)
    wait_for_message_in_log(caplog, r"Trying to do NACK explicitly sending the message to DLQ.*")
    message_consumer.close()
    # Assert
    some_destination_dlq = f"/queue/DLQ.{some_destination}"
    message_from_dlq = get_latest_message_from_destination_using_test_listener(some_destination_dlq)
    assert message_from_dlq.body == {
        "owner_id": str(sample_body["owner_id"]),
        "title": sample_body["title"],
        "salt_addicted": sample_body["salt_addicted"],
        "registered_at": sample_body["registered_at"].isoformat(timespec="milliseconds"),
    }
```

The callbacks for each scenario:

```python
from unittest import mock

from django_stomp.helpers import create_dlq_destination_from_another_destination
from django_stomp.services import producer

from transactions_with_django_stomp import do_the_thing
from transactions_with_django_stomp.do_the_thing import build_news_and_dispatch_them

callback_scenario_1 = "tests.transactions_with_django_stomp.change_callback_do_the_thing.build_news_and_dispatch_them_mocked"
callback_scenario_2 = "tests.transactions_with_django_stomp.change_callback_do_the_thing.build_news_and_dispatch_them_mocked_raise_exception_during_second_send"
callback_scenario_3 = "tests.transactions_with_django_stomp.change_callback_do_the_thing.build_news_and_dispatch_them_mocked_raise_exception_during_computation"


def build_news_and_dispatch_them_mocked(payload, append_to_destination):
    # Change destinations so we can retrieve them during tests
    with mock.patch.object(do_the_thing, "xyz_destination", f"/queue/xyz-scenario-1-{append_to_destination}"):
        with mock.patch.object(do_the_thing, "acme_destination", f"/queue/acme-scenario-1-{append_to_destination}"):
            # Let's call our main callback function!
            build_news_and_dispatch_them(payload)


def build_news_and_dispatch_them_mocked_raise_exception_during_second_send(payload, append_to_destination):
    with mock.patch.object(do_the_thing, "xyz_destination", f"/queue/xyz-scenario-2-{append_to_destination}"):
        with mock.patch.object(do_the_thing, "acme_destination", f"/queue/acme-scenario-2-{append_to_destination}"):
            with mock.patch.object(
                producer,
                "create_dlq_destination_from_another_destination",
                wraps=create_dlq_destination_from_another_destination,
            ) as mocked_create_dlq_destination_from_another_destination:
                # This side effect configuration will make "send function" work only once
                mocked_create_dlq_destination_from_another_destination.side_effect = [
                    create_dlq_destination_from_another_destination,
                    RuntimeError,
                ]
                build_news_and_dispatch_them(payload)


def build_news_and_dispatch_them_mocked_raise_exception_during_computation(payload):
    with mock.patch(
        "transactions_with_django_stomp.do_the_thing.retrieve_events_to_be_dispatched"
    ) as mocked_retrieve_events_to_be_dispatched:
        mocked_retrieve_events_to_be_dispatched.side_effect = [RuntimeError]
        build_news_and_dispatch_them(payload)

```

Fire up your RabbitMQ through Compose, and let's see the execution of the tests.

### Tests for scenario 1

Running the test, you'd see something like the following image:

![RabbitMQ Management shows 4 queues.](/assets/posts/blog-15-order-5-image-5-scenario-1-result.png "Result of scenario 1 on RabbitMQ Management.")

When Django STOMP connects to a destination as a consumer, [it automatically creates its DLQ](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/django_stomp/execution.py#L46-L47). That's why we see 2 queues for `scenario-1`. Then we have one message for XYZ and ACME.

![It shows the actual message contained in the ACME queue.](/assets/posts/blog-15-order-6-image-6-scenario-1-acme-message.png "Message sent to ACME queue.")

![It shows the actual message contained in the XYZ queue.](/assets/posts/blog-15-order-7-image-7-scenario-1-xyz-message.png "Message sent to XYZ queue.")

Although we are looking at the messages, our test could verify the messages have been published as expected.

### Tests for scenario 2

Running the test case for scenario 2, that's the outcome:

![RabbitMQ Management shows 3 queues.](/assets/posts/blog-15-order-8-image-8-scenario-2-result.png "Result of scenario 2 on RabbitMQ Management.")

You might be wondering why only XYZ has a queue; that's because our [publisher sent a message to it during the transaction](https://github.com/willianantunes/tutorials/blob/8d4e0c16ee2fd84c3ce3e983e315f4f1c99c94ef/2022/01/transactions-with-django-stomp/transactions_with_django_stomp/do_the_thing.py#L45), so RabbitMQ had to create it. We can't say the same for ACME, though, as [we configured to raise an exception during the test](https://github.com/willianantunes/tutorials/blob/8d4e0c16ee2fd84c3ce3e983e315f4f1c99c94ef/2022/01/transactions-with-django-stomp/tests/transactions_with_django_stomp/change_callback_do_the_thing.py#L33-L36). But notice that the queue XYZ has no messages because the transaction didn't finish properly.

Opening the message in the DLQ, we can see the reason to be there: it was rejected with NACK.

![It shows the actual message contained in the DLQ queue.](/assets/posts/blog-15-order-9-image-9-scenario-2-dlq-message.png "Message sent to DLQ queue.")

### Tests for scenario 3

Now, look at the results in the RabbitMQ Management after the execution of the test for scenario 3:

![RabbitMQ Management shows 2 queues.](/assets/posts/blog-15-order-10-image-10-scenario-3-result.png "Result of scenario 3 on RabbitMQ Management.")

RabbitMQ didn't create the queues for ACME and XYZ as it didn't have the opportunity to. An exception was raised because of [this side effect configured before the callback execution](https://github.com/willianantunes/tutorials/blob/8d4e0c16ee2fd84c3ce3e983e315f4f1c99c94ef/2022/01/transactions-with-django-stomp/tests/transactions_with_django_stomp/change_callback_do_the_thing.py#L44). Then we have the message in the DLQ:

![It shows the actual message contained in the DLQ queue.](/assets/posts/blog-15-order-11-image-11-scenario-3-dlq-message.png "Message sent to DLQ queue.")

### Tips

If your RabbitMQ Management is full of queues, you can execute the following command inside the container to delete them:

```shellsession
rabbitmqctl list_queues | awk '{ print $1 }' | xargs -L1 rabbitmqctl delete_queue
```

In order to understand STOMP in more detail, it's a good idea to look at the logs made by [stomp.py](https://github.com/jasonrbriggs/stomp.py). [You can activate it easily by the code I left in the project](https://github.com/willianantunes/tutorials/blob/8d4e0c16ee2fd84c3ce3e983e315f4f1c99c94ef/2022/01/transactions-with-django-stomp/tests/conftest.py#L31-L33).

## Conclusion

You'll probably notice that we asserted things using the [Management Plugin](https://www.rabbitmq.com/management.html) (the RabbitMQ web console). We had considerable work writing our tests also. The idea was to show how you can see STOMP transactions in action, but this is usually not required. The library guarantees the infrastructure code will just work as expected. I only recommend doing a more detailed assertion if you want to understand how the protocol works. To illustrate, Django STOMP asserts its business rules using the actual web console for [ActiveMQ](https://github.com/juntossomosmais/django-stomp/tree/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/tests/support/activemq) and [RabbitMQ](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/tests/support/rabbitmq/__init__.py). Look at [this test where a message is dequeued and how the test case is verified](https://github.com/juntossomosmais/django-stomp/blob/65e7cb86f8f6e2336a2739df8f33f985c9b4c792/tests/integration/test_execution.py#L138-L151). You can do pretty much the same with AMQP to study it! Just write tests, see the logs, and comprehend how it works.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/01/transactions-with-django-stomp).

Posted listening to [Shadow of the Colossus: Prologue 🎶](https://youtu.be/57jIlw6HmCE).
