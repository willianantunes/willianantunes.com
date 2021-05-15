---
id: fd4b8a80-b58b-11eb-ad61-7f491aff1914
title: "GKE Ingress: How to fix a 502 bad gateway error"
date: 2021-05-15T14:44:02.058Z
cover: /assets/posts/blog-5-gke-ingress-502.png
description: When you configure your application and receive an error 502 (Bad
  Gateway), mostly this happens because of a wrong setup. To illustrate, let's
  see one circumstance and how to fix it.
tags:
  - kubernetes
  - ingress
  - gcp
---
Past few days, I was configuring a GKE cluster for my personal projects. Some of them had to be accessed through the internet; hence I created an ingress to do this job. Here's [an example of ingress using Terraform](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/ingress):

```ruby
resource "kubernetes_ingress" "default" {
  metadata {
    name = "sample-ingress"
    namespace = "production"

    annotations = {
      "ingress.gcp.kubernetes.io/pre-shared-cert" = "spacejam-cert-manager"
      "kubernetes.io/ingress.global-static-ip-name" = "my-honest-public-ip"
    }
  }

  spec {
    rule {
      host = "spacejam.com"
      http {
        path {
          backend {
            service_name = "spacejam-np-service"
            service_port = 8000
          }
        }
      }
    }
  }
}
```

The service named `spacejam-np-service` was bound to a deployment like the following:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spacejam-web-deployment
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: spacejam-web-deployment
  template:
    metadata:
      labels:
        app: spacejam-web-deployment
    spec:
      containers:
        - name: spacejam-web-container
          image: gcr.io/agrabah-project/spacejam:latest-prd
          envFrom:
            - configMapRef:
                name: spacejam-configmap
          ports:
            - name: http
              containerPort: 8000
          livenessProbe:
            httpGet:
              path: "/health-check"
              port: 8000
            initialDelaySeconds: 10
            timeoutSeconds: 5
```

Notice that it does not have a readiness probe entry 🤔. After creating all of the manifests, I tried to access the host `spacejam.com`, but I received a [502 error](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502) 😯.

## Is the service running correctly?

My first idea was to check the service. Is it healthy or not? The command `kubectl describe deployments spacejam-web-deployment` returned that it was fine, then I ran another command `kubectl port-forward deployment/spacejam-web-deployment 8000:8000` so I could access the service directly through `http://localhost:8000/health-check`. Everything was working as expected. My second idea was to understand how the ingress checks if a service is healthy or not.

### Checking backend health status and finding the root cause

When you create an ingress, GKE will create a native load balancer afterward. You can know the LB's name through the command:

```shellsession
kubectl get ingress sample-ingress -o jsonpath='{.metadata.annotations.ingress\.kubernetes\.io/url-map}'
```

Then I opened its configuration, and I saw that one of my backends was unhealthy 👀:

![The image shows all the backend services of the ingress native load balancer.](/assets/posts/blog-5-image-1.png "GCP Load Balancer backend services.")

I could understand the root cause of the error when I noticed which path the backend service was using:

![Health check attributes of a given backend service. The path attribute has the value of "/".](/assets/posts/blog-5-image-2.png "Backend service health check setup")

The targeted service returns 404 instead of 200 for the path `/`.

## Understanding GKE behavior

Looking over *[GKE Ingress for HTTP(S) Load Balancing](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress#overview)* guide, the section [Default and inferred parameters](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress#def_inf_hc) shows us that the ingress will check the POD's spec `containers[].readinessProbe.httpGet.path` to get the path to verify the service health, but if it's empty, it will use the default value `/`. Moreover, this statement is important:

> When you expose one or more Services through an Ingress using the default Ingress controller, GKE creates a Google Cloud external HTTP(S) load balancer or a Google Cloud internal HTTP(S) load balancer. Both of these load balancers support multiple backend services on a single URL map. Each of the backend services corresponds to a Kubernetes Service, and each backend service must reference a Google Cloud health check. This health check is different from a Kubernetes liveness or readiness probe because the health check is implemented outside of the cluster.

## Fixing the problem

To quickly solve it, I added the following to my deployment manifest:

```yaml
livenessProbe:
  httpGet:
    path: "/health-check"
    port: 8000
  initialDelaySeconds: 10
  timeoutSeconds: 5
```

Afterward, the backend service was updated to the correct path:

![Health check attributes of a given backend service. The path attribute has the value of "/health-check".](/assets/posts/blog-5-image-3.png "Backend service health check setup after fix")

## Summing-up

There is a considerable debate on this very topic in the issue [Ingress Healthcheck Configuration](https://github.com/kubernetes/ingress-gce/issues/42) on [kubernetes/ingress-gce](https://github.com/kubernetes/ingress-gce) repository. Looking through issues on GitHub is an excellent way to understand how an application or service is evolving. It's been more than three years, and it's not resolved yet.

In my next blog entry ✍, I'll explain how I configured IPv4 and IPv6 public addresses using only one ingress on GKE. Till next time!