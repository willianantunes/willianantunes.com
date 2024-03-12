---
id: 1e888470-e0c0-11ee-9f1e-c71de7e59f23
title: Monitoring K8S resources through its APIs
date: 2024-03-12T22:30:24.589Z
cover: /assets/posts/blog-41-monitoring-k8s-resources-through-its-apis.png
description: You can use the Kubernetes API to monitor resources and take
  actions based on the information you get from it. Let's see a sample of how to
  do it.
tags:
  - python
  - k8s
  - kind
---
Let's say you need to monitor when a certificate is about to expire in a Kubernetes cluster. Using [cert-manager](https://cert-manager.io/docs/), when you configure a [ClusterIssuer](https://cert-manager.io/docs/reference/api-docs/#cert-manager.io/v1.ClusterIssuer), for example, you can set an email to be notified when a certificate is about to expire. Let's assume this does not work. What can you do? 🤔

One approach is to create a Python application that uses the Kubernetes API to monitor the certificate resource and take actions based on the information it provides. For example, you can force the application to fail on purpose, so your monitoring system can alert you about it.

Let's see a real example. Let's say you have the following certificate resource:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: develop-willianantunesi-com-br
  namespace: development
spec:
  commonName: '*.develop.willianantunesi.com.br'
  dnsNames:
  - '*.develop.willianantunesi.com.br'
  - develop.willianantunesi.com.br
  duration: 2160h0m0s
  issuerRef:
    kind: ClusterIssuer
    name: this-cluster-issuer-does-not-exist
  renewBefore: 480h0m0s
  secretName: develop-willianantunesi-com-br-tls
  subject:
    organizations:
    - willianantunes
status:
  conditions:
  - lastTransitionTime: "2024-02-06T13:11:28Z"
    message: Certificate is up to date and has not expired
    observedGeneration: 1
    reason: Ready
    status: "True"
    type: Ready
  notAfter: "2024-05-15T13:04:35Z"
  notBefore: "2024-02-15T13:04:36Z"
  renewalTime: "2024-04-25T13:04:35Z"
  revision: 2
```

Notice that the [`status`](https://cert-manager.io/docs/reference/api-docs/#cert-manager.io/v1.CertificateStatus) attribute has a `renewalTime` attribute. This is the attribute that cert-manager uses to know when to renew the certificate. This is set by cert-manager automatically when a certificate is issued. Thus, a script can use [Kubernetes Python Client](https://github.com/kubernetes-client/python) to consult the certificate resource above and analyze the `renewalTime` attribute. If it is in the past, that means the cert-manager is still trying to renew the certificate without success. That's when we can force the application to fail on purpose. Check out this example:

```python
import logging
import sys

from datetime import datetime

import kubernetes.client

from kubernetes import config
from kubernetes.client.rest import ApiException

_logger = logging.getLogger(__name__)
_group = "cert-manager.io"
_version = "v1"


def _create_configuration():
    configuration = kubernetes.client.Configuration()
    # Accessing the API from within a Pod
    # https://kubernetes.io/docs/tasks/run-application/access-api-from-pod/#directly-accessing-the-rest-api
    config.load_incluster_config(configuration)
    return configuration


def check_certificates_and_inform_on_slack_if_applicable(certificates: list[str], now=datetime.now().astimezone()):
    _logger.debug("Generating configuration")
    configuration = _create_configuration()

    should_exit = False
    with kubernetes.client.ApiClient(configuration) as client:
        api = kubernetes.client.CustomObjectsApi(client)
        for certificate in certificates:
            _logger.info("Checking certificate: %s", certificate)
            namespace, name = certificate.split("|")
            try:
                api_response = api.get_namespaced_custom_object(_group, _version, namespace, "certificates", name)
            except ApiException as e:
                _logger.error("Exception when calling CustomObjectsApi->get_namespaced_custom_object")
                raise e
            renewal_time = api_response["status"].get("renewalTime")
            if not renewal_time:
                _logger.error("Certificate %s does not have a renewalTime", certificate)
                should_exit = True
                continue
            renewal_time = datetime.fromisoformat(renewal_time)
            if renewal_time <= now:
                _logger.error("Certificate %s is about to expire on %s", certificate, renewal_time)
                should_exit = True
        if should_exit:
            _logger.error("Some certificates are either about to expire or invalid. Please fix them ASAP")
            sys.exit(1)
    _logger.info("Work has been completed")
```

If `should_exit` is `True`, we log an error and exit the program. To check it from time to time, we can use a `CronJob` that runs every day at 7 AM:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  namespace: development
  name: watchdog-k8s-cronjob
spec:
  schedule: "0 7 * * *"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: watchdog-k8s-sa
          containers:
            - name: watchdog-k8s
              image: watchdog_k8s-remote-interpreter
              imagePullPolicy: IfNotPresent
              envFrom:
                - configMapRef:
                    name: watchdog-k8s-configmap
          restartPolicy: Never
```

Did you notice that the attribute `serviceAccountName` is set? The script requires it to consult the Kubernetes API. Proper [RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) for `watchdog-k8s-sa` is also needed:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: development
  name: watchdog-k8s-sa

---

kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: development
  name: watchdog-k8s-role
rules:
  - apiGroups:
      - "cert-manager.io"
    resources:
      - "certificates"
    verbs:
      - "get"

---

kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: watchdog-k8s-role-binding
  namespace: development
subjects:
  - kind: ServiceAccount
    name: watchdog-k8s-sa
    namespace: development
roleRef:
  kind: Role
  name: watchdog-k8s-role
  apiGroup: rbac.authorization.k8s.io
```

Check out the [whole project on GitHub](https://github.com/willianantunes/tutorials/tree/master/2024/03/watchdog-k8s) if you have any further questions.

I hope this may help you. See you 😄!
