---
id: cb225740-3478-11ef-8737-fbbe24affed3
title: "NGINX on Kubernetes Made Easy: Your Local Development Sandbox"
date: 2024-06-27T11:37:40.180Z
cover: /assets/posts/blog-45-nginx-on-kubernetes-made-easy-your-local-development-sandbox.png
description: Have your own NGINX playground environment on localhost Kubernetes!
  Learn how it works, invoke automation and many more!
tags:
  - nginx
  - proxy
  - k8s
  - kind
---
**Warning:** This is a note, so don't expect much 😅!

Sometimes, the default configuration of your reverse proxy does not behave as expected, given the context of your application. In that case, an adjustment should be applied carefully to avoid unintended consequences. Using [Ingress NGINX Controller](https://github.com/kubernetes/ingress-nginx?tab=readme-ov-file) and [kind](https://github.com/kubernetes-sigs/kind), you can easily create a local development sandbox to test everything you need before promoting the configuration.

Let's say you want to understand how [`proxy_next_upstream`](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_next_upstream) works. Download the [playground project](https://github.com/willianantunes/tutorials/tree/master/2024/06/nginx_next_upstream) and execute the following commands in order:

```shell
kind create cluster --config kind-config.yaml
kubectl create namespace development
kubectl config set-context --current --namespace=development
helm repo add ingress-nginx charts/ingress-nginx
helm repo update
helm install nginx-internal ingress-nginx/ingress-nginx --namespace development -f ./nginx-internal-values.yaml
```

With the controller adequately installed, we can proceed with the creation of the scenario:

```shell
kubectl apply -f scenario.yaml
```

It has the following objects:

* POD named `env-web-server-1`: A web server in Python that takes 3 seconds to answer a request.
* POD named `env-web-server-2`: A web server in Python that has no delays. It answers a request immediately.
* SERVICE named `env-web-server-service`: It selects both previous PODs.
* INGRESS named `all-rules`: It sends all requests to the previous SERVICE, regardless of the host.

Wait a few seconds, and we should be able to access `http://localhost:8000/`. If we press F5, we'll get `APP-1` or `APP-2` output. They alternate as we press F5. `APP-1` delays 3 seconds to answers, and the reverse proxy accepts it, but let's say we don't want it to happen. We want to make the reverse proxy attempt another upstream. We can force this behavior by adding a timeout of 2 seconds with the following annotation:

```yaml
nginx.ingress.kubernetes.io/proxy-read-timeout: "2"
```

After the configuration is applied, if we press F5, we will only see `APP-2` content on your browser. `APP-1` won't appear anymore. NGINX logs will inform you of the following:

```
2024/06/27 00:21:51 [error] 112#112: *5248 upstream timed out (110: Operation timed out) while reading response header from upstream, client: 172.22.0.3, server: _, request: "GET / HTTP/1.1", upstream: "http://10.244.1.5:8080/", host: "localhost:8000"
```

Suppose we don't want the request to be passed to the next server. We can turn off the feature by adding another annotation to the Ingress manifest:

```yaml
nginx.ingress.kubernetes.io/proxy-next-upstream: "off"
```

If we press F5 until the reverse proxy tries to establish a connection with `APP-1`, NGINX will return 504 this time; it won't try to establish a connection with `APP-2`.

```
2024/06/27 00:29:44 [error] 149#149: *7212 upstream timed out (110: Operation timed out) while reading response header from upstream, client: 172.22.0.3, server: _, request: "GET / HTTP/1.1", upstream: "http://10.244.1.5:8080/", host: "localhost:8000"
{"time": "2024-06-27T00:29:44+00:00", "remote_addr": "-", "x_forward_for": "172.22.0.3", "request_id": "228bd03f947cf4168578c31f6eeaa405", "remote_user": "-", "bytes_sent": 702, "request_time": 2.001, "status": 504, "vhost": "localhost", "request_proto": "HTTP/1.1", "path": "/", "request_query": "-", "request_length": 643, "duration": 2.001,"method": "GET", "http_referrer": "-", "http_user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", "http_origin": "-", "true_client_ip": "-"}
```

Well, if the tests are done, we can destroy our sandbox:

```shell
kind delete cluster
```

I hope this may help you. See you! 😄