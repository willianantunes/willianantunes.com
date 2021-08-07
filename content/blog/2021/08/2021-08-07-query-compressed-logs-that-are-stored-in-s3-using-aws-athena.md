---
id: c31cb980-f7ab-11eb-b3c2-fdcf2add878c
title: Query compressed logs that are stored in S3 using AWS Athena
date: 2021-08-07T20:03:27.469Z
cover: /assets/posts/blog-10-query-compressed-logs-that-are-stored-in-s3-using-aws-athena.png
description: Let's see how we can explore the data in a bucket using SQL with AWS Athena.
tags:
  - aws
  - serverless
  - bucket
  - sql query engine
---
Recently someone asked me to create an easy way to consult all the logs stored in S3. Unfortunately, the person who was trying to check all the log files couldn't consult them suitably because of the following:

* 20.3 GB of data compressed with GZIP.
* Each file has more than 40 thousand lines.
* Many folders, with each containing various compressed files.

Moreover, those logs have been exported from a Log Group that is not available on CloudWatch anymore; otherwise, we could use Log Insights right away 😅. 

## Ideas that I had at first glance

Some options that I thought of when I received the request:

* **Restore from S3 to a Log Group:** I'd have to create a serverless function that would read all the objects in S3, check if one is a GZIP, if true, then uncompress it, read the log file and send each line using [The PutLogEvents API](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html) to the [Log Group](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html#SendingLogData).
* **Download files from S3 and fill them into Elasticsearch:** Simply put, I'd expend some time programming something to understand the underlying data from the logs to populate an index in Elasticsearch. A simple LOREM would be enough to do the ETL followed by the Kibana startup afterward.
* **Use some ETL service from AWS and push what has been processed to a Log Group:** [AWS Glue](https://aws.amazon.com/glue/) is the service that can be used for this purpose. So it's another option to make everything inside the cloud itself.

Before executing one of these options, I sought cookbooks, lessons learned, and tutorials to help me with something that I couldn't grasp at first. That's when I met AWS Athena 😍! If you look at [its overview](https://aws.amazon.com/athena/?nc=sn&loc=1), you can get a quick idea of what it may deliver to you:

> Amazon Athena is an interactive query service that makes it easy to analyze data in Amazon S3 using standard SQL.

But how would I query the bucket with the compressed log files 🤔?

## Understanding AWS Athena and applying a solution

When I found an [AWS blog post describing an example of how to consult access logs](https://aws.amazon.com/premiumsupport/knowledge-center/analyze-logs-athena/), I quickly get the point! For my case, basically, the plan was to arrange the following topics:

1. Identify the folder in your bucket where you'd like AWS Athena to analyze to create the table. It's important to mention that it will look over all objects recursively.
2. Understand a REGEX pattern that can capture each line of your log file in a meaningful way (below, I show you my occasion).
3. Define the table schema to match the capturing group you configured and some extra metadata to inform AWS Athena to create everything properly.

The first was relatively easy to handle. My folder structure is something like the following:

```
bucket-name/
│
└── 0smpprubzz/  <--- API Gateway ID
    └── 2574f75d-7a93-4387-bed3-2ea5f4e2be59/  <--- folder with many other folders
        ├── 00107dc08cd17d3ea18805491763048c/  <--- sort of aggregation of log files
        |   ├── 000000.gz  <--- Compressed log file 0
        |   ├── 000001.gz  <--- Compressed log file 1
        |   └── 00000X.gz  <--- Compressed log file X
        |       └── 00000X <--- If you open the compressed log file, you get this file. It has no extension!
        ├── 00249903990fb8d8cc29b88e4b0d3a1a/  <--- sort of aggregation of log files
        |   ├── 000000.gz  <--- Compressed log file 0
        |   ├── 000001.gz  <--- Compressed log file 1
        |   └── 00000X.gz  <--- Compressed log file X
        |       └── 00000X <--- If you open the compressed log file, you get this file. It has no extension!
        └── X/  <--- there are more than 1000 folders like this
```

Thus I had to use the following:

```
s3://bucket-name/0smpprubzz/2574f75d-7a93-4387-bed3-2ea5f4e2be59/
```

For the second topic, I just had to look at some entries from a random log file to recognize a pattern. For instance:

```
2021-06-18T16:41:50.920Z (3e08ac47-b24b-417f-9d8c-13a4bb335ac3) Starting execution for request: Ze08ac47-b24b-417f-9d8c-13a4bb335ac3
2021-06-18T16:41:50.920Z (3e08ac47-b24b-417f-9d8c-13a4bb335ac3) HTTP Method: OPTIONS, Resource Path: /jafar-application/v1/lamps
2021-06-18T16:41:50.920Z (3e08ac47-b24b-417f-9d8c-13a4bb335ac3) Method request path: {}
2021-06-18T16:41:50.920Z (3e08ac47-b24b-417f-9d8c-13a4bb335ac3) Method request query string: {}
2021-06-18T16:41:50.920Z (3e08ac47-b24b-417f-9d8c-13a4bb335ac3) Method request headers: {Origin=https://agrabah.gov.eg, sec-fetch-mode=cors, X-Akamai-SR-Hop=1, Akamai-Origin-Hop=2, sec-fetch-site=same-site, Accept=*/*, Referer=https://agrabah.gov.eg/, User-Agent=Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G570M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.0 Chrome/87.0.4280.141 Mobile Safari/537.36, X-Forwarded-Proto=https, Host=api.agrabah.gov.eg, Accept-Encoding=gzip, Pragma=no-cache, True-Client-IP=X.P.219.112, X-Forwarded-Port=443, X-Amzn-Trace-Id=Root=X-60ccccce-P84a5379108e3a2773817ca1, Via=1.1 v1-akamaitech.net(ghost) (AkamaiGHost), 1.1 akamai.net(ghost) (AkamaiGHost), X-Akamai-CONFIG-LOG-DETAIL=true, Access-Control-Request-Method=GET, Cache-Control=no-cache, max-age=0, Access-Control-Request-Headers=authorization,x_etag, X-Forwarded-For=X.P.219.112, X.P.63.4, X.P.247.39, Accept-Language=pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7, sec-fetch-dest=empty}
```

Then I came up with the following regex (see it on [RegEx website](https://regexr.com/63b0d)):

```
^(\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}[+-\.]\d{1,3}Z?) (\(.+?\)) (.+)$
```

Check out the value of each group from a sample line:

![A regex expression is applied on the first line of a sample text from a random log file.](/assets/posts/blog-10-image-1-regex-sample.png "Sample result of the regex given the first line of a small part of the log file.")

It extracts three groups; hence we can use them to finally define the table schema. Through the [User Guide](https://docs.aws.amazon.com/athena/latest/ug/what-is.html), which describes [how "*create table"* works](https://docs.aws.amazon.com/athena/latest/ug/create-table.html), I wrote the following DDL statement:

```sql
CREATE EXTERNAL TABLE `jafar_database.agrabah`(
  `requestdatetime` STRING,
  `identifier` STRING,
  `message` STRING)
ROW FORMAT SERDE
  'org.apache.hadoop.hive.serde2.RegexSerDe'
WITH SERDEPROPERTIES (
  'input.regex'='^(\\d{4}-\\d{2}-\\d{2}T\\d{2}\\:\\d{2}\\:\\d{2}[+-\\.]\\d{1,3}Z?) (\\(.+?\\)) (.+)$')
STORED AS INPUTFORMAT
  'org.apache.hadoop.mapred.TextInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION
  's3://bucket-name/0smpprubzz/2574f75d-7a93-4387-bed3-2ea5f4e2be59/'
```

In my case, STRING for all columns wasn't a problem (if it will ever be, I update this article, but you should know that you can use [many other types](https://docs.aws.amazon.com/athena/latest/ug/data-types.html), like TIMESTAMP). I didn't specify the compression type because [it will get it by the file extension by default](https://docs.aws.amazon.com/athena/latest/ug/compression-formats.html). By the way, if you look at the regex again, I had to use double backslash because [RegexSerDe](https://docs.aws.amazon.com/athena/latest/ug/regex-serde.html) follows the Java Standard: the backslash is an escape character in the Java String class.

Given you created everything accordingly, you can use some [DQL](https://docs.aws.amazon.com/athena/latest/ug/select.html) and explore your data!

![It shows a query editor with a simple DQL statement to retrieve the first 10 rows.](/assets/posts/blog-10-image-2-query.png "AWS Athena Query Editor.")

## Conclusion

This approach to consulting data is compelling, but it's worth mentioning that it can become expensive pretty quickly though. Also, it depends on the requirements and how a person will use it. Therefore some care with [performance concerns](https://aws.amazon.com/blogs/big-data/top-10-performance-tuning-tips-for-amazon-athena/) is fundamental.

Posted listening to [Shout, Disturbed](https://youtu.be/Bh_rCiU-9_A) 🎶.