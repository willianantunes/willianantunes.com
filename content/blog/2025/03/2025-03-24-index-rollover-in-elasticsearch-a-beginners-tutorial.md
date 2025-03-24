---
id: 1d64b090-08bb-11f0-ba67-131bb72487cc
title: "Index Rollover in Elasticsearch: A Beginner's Tutorial"
date: 2025-03-24T14:20:19.386Z
cover: /assets/posts/blog-49-index-rollover-in-elasticsearch-a-beginner-s-tutorial.png
description: This hands-on tutorial shows you a complete project with Terraform
  and Python that sets up index rollover. It helps you maintain optimal index
  sizes, improving the overall performance of your Elasticsearch deployment
tags:
  - elasticsearch
  - terraform
  - python
---
[Rollover](https://www.elastic.co/guide/en/elasticsearch/reference/8.17/index-rollover.html) is a crucial action. It allows you to create a new write index when the current one meets a defined threshold. It makes your system more optimized and scalable. How does it work? Well, as always, let's observe its behavior through practice. [Check out this project](https://github.com/willianantunes/tutorials/tree/master/2025/03/elasticsearch-index-lifecycle-rollover). It has an agent that executes `GET _cat/thread_pool?v` and `GET /_tasks?pretty=true&human=true&detailed=true` through a Python code. It parses the answers into JSON documents and sends them to index alias `es-thread-pool` or `es-tasks`. It requires an [infrastructure in Elasticsearch](https://github.com/willianantunes/tutorials/blob/master/2025/03/elasticsearch-index-lifecycle-rollover/iac/main.tf) to be created first. Execute the following command to create it:

```shell
./scripts/start-development.sh
```

Access the [index templates](http://localhost:5601/app/management/data/index_management/templates) page and use the credential `elastic:elastic` when it's complete. You'll see two custom index templates:

* es-tasks-index-template
* es-thread-pool-index-template

Now access the tab [Data Streams](http://localhost:5601/app/management/data/index_management/data_streams). You'll see three system data streams created by Elasticsearch. Now execute the command:

```shell
docker compose run --rm -e TEST_COLLECT_METRICS=1 integration-tests python -m unittest tests.agents.test_elasticsearch.TestElasticsearch.test_collect_metrics
```

Two new data streams will appear, each one with one index:

![Screenshot of the Kibana Index Management page showing a list of data streams with their health, indices, and data retention details.](/assets/posts/blog-49-asset-1-data-streams.png "Kibana Index Management - Data Streams View")

If you click on the number of indices on `es-tasks`, you'll see its indices. In my case, it says there are 5 documents:

![Screenshot of the Kibana Index Management page showing a single index named "ds-es-tasks-2025.03.24-000001" with health status "green", 5 documents, and 9.2kb storage size.](/assets/posts/blog-49-asset-2-indices-es-tasks.png "Kibana Index Management - Index Details")

The rollover trigger is configured to happen when an index has at least [2 documents](https://github.com/willianantunes/tutorials/blob/17d09bf08908e7d5c59fc0d197fcd8cd612fe766/2025/03/elasticsearch-index-lifecycle-rollover/iac/main.tf#L46). After no more than 1 minute ([know this](https://github.com/willianantunes/tutorials/blob/17d09bf08908e7d5c59fc0d197fcd8cd612fe766/2025/03/elasticsearch-index-lifecycle-rollover/iac/main.tf#L364-L365)), this is what happens:

![Screenshot of the Kibana Index Management page showing two indices, "ds-es-tasks-2025.03.24-000001" and "ds-es-tasks-2025.03.24-000002", both with health status "green" and belonging to the "es-tasks" data stream.](/assets/posts/blog-49-asset-3-indices-es-tasks-rollover.png "Kibana Index Management - Multiple Indices View")

A new index is created! It will occur every time a trigger criterion is matched. Keep in mind that this definition is for the sake of this post.

Don't need data streams? Change the flag [`enable_data_streams`](https://github.com/willianantunes/tutorials/blob/17d09bf08908e7d5c59fc0d197fcd8cd612fe766/2025/03/elasticsearch-index-lifecycle-rollover/iac/main.tf#L2) in the Terraform code and see how the rollover works when only indices are used without data streams.

I hope this may help you. See you! 😄