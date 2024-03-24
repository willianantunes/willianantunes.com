---
id: af660fc0-ea0d-11ee-b6af-7ff654b92ecd
title: Understanding DNS behavior with Bind9 and dnsmasq
date: 2024-03-24T18:38:19.345Z
cover: /assets/posts/blog-43-understanding-dns-behavior-with-bind9-and-dnsmasq.png
description: Getting to know DNS behavior is crucial. This article will help you
  understand how DNS works by creating a simple lab with Bind9 and dnsmasq.
tags:
  - dns
  - proxy
---
**Warning:** This is a note, so don't expect much 😅!

Microsoft has a document called Cloud Adoption Framework that provides best practices for adopting the cloud. One section discusses [DNS integration at scale](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/private-link-and-dns-integration-at-scale). So far, so good, though how do we understand many of the concepts presented there? For example, when I read it, I lacked a deeper understanding of DNS 🙄. Here at the blog, we often create simplified environments to help illustrate concepts. So, the same applies to DNS. Let's see the project's lab structure:

![The lab's architecture is composed of a starting node that we call dns-initial. It's the DNS Proxy. It forwards queries to two other nodes: dns-a and dns-b.](/assets/posts/blog-43-asset-1-lab-architecture.png "DNS Proxy and two other DNS servers.")

Explanation:

* DNS Server `dns-initial` is the DNS Proxy.
* `dns-initial` forwards queries to `dns-a` and `dns-b` if the zone is `privatelink.database.windows.net`.
* Only `dns-a` is able to solve a query for `db-a.privatelink.database.windows.net`.
* Only `dns-b` is able to solve a query for `db-b.privatelink.database.windows.net`.

To start servers A and B, run the following command:

```shell
docker compose up -d dns-a dns-b
```

You can either run the DNS Proxy with [`Bind9`](https://wiki.debian.org/Bind9) or [`dnsmasq`](https://wiki.debian.org/dnsmasq). To run the DNS Proxy with `dnsmasq`, execute the following command:

```shell
docker compose up dns-initial-dnsmasq
```

In another terminal, you can query the `dns-initial-dnsmasq` with the following commands:

```shell
dig -t A @127.0.0.1 -p 30005 willianantunes.com
dig -t A @127.0.0.1 -p 30005 db-a.privatelink.database.windows.net
dig -t A @127.0.0.1 -p 30005 db-b.privatelink.database.windows.net
```

Sometimes, the query will return `NXDOMAIN` either for `db-a` or `db-b`. This happens because the DNS Proxy returns the first answer it receives. If you query `db-a.privatelink.database.windows.net` and receive `NXDOMAIN`, it means server B answered first to the DNS Proxy. You can change the [`cache-size`](https://github.com/willianantunes/tutorials/blob/2270719830764f2235abc810a3880a6673128a61/2024/03/dns-bind9/dnsmasq.dns.conf#L13) in the `dnsmasq.dns.conf` file. This will make the answer to the query consistent because the DNS Proxy will cache it.

How about running the DNS Proxy with `Bind9`? Execute the following command:

```shell
docker compose up dns-initial
```

In another terminal, you can query the `dns-initial` with the following commands (notice the port is different):

```shell
dig -t A @127.0.0.1 -p 30010 willianantunes.com
dig -t A @127.0.0.1 -p 30010 db-a.privatelink.database.windows.net
dig -t A @127.0.0.1 -p 30010 db-b.privatelink.database.windows.net
```

Check out the [whole project on GitHub](https://github.com/willianantunes/tutorials/tree/master/2024/03/dns-bind9) to see how the lab was set up.

I hope this may help you. See you 😄!
