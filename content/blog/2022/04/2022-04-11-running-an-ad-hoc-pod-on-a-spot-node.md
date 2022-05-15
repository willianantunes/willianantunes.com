---
id: c4e82300-b9f0-11ec-9dea-f99921b288c8
title: Running an AD-HOC POD on a SPOT node
date: 2022-04-11T23:41:29.246Z
cover: /assets/posts/blog-20-running-an-ad-hoc-pod-on-a-spot-node.png
description: Create an ad-hoc container and understand how you can make it run
  in a SPOT node or not, simply with a "kubectl run" command.
tags:
  - kubernetes
  - network
  - troubleshooting
---
I was configuring a [security group](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html) for a new RDS on AWS. The goal was to allow a connection to the RDS only from services running on a [SPOT node](https://aws.amazon.com/about-aws/whats-new/2020/12/amazon-eks-support-ec2-spot-instances-managed-node-groups/) on a Kubernetes Cluster. To test the connection, I created an ad-hoc POD (swiss-army container known as *[netshoot](https://github.com/nicolaka/netshoot)*) with the following command:

```shell
kubectl -n development run tmp-shell --rm -i --tty --image nicolaka/netshoot -- /bin/bash
```

When the container was ready, I tested the connection using the `nmap` command:

```shell
nmap -v -p 5432 -Pn --open purpose-department-project-environment.cluster-ro-agrabah.us-east-1.rds.amazonaws.com
```

The thing is, it didn't work! The issue is that the [K8S scheduler](https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/) was spinning up the container in an on-demand node. The environment I was doing the job had [affinity rules](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity). So I checked out one POD as an example running on a SPOT node. It had something like this:

```json
{
  "spec": {
    "nodeSelector": {
      "lifecycle": "Ec2Spot"
    },
    "tolerations": [
      {
        "effect": "NoSchedule",
        "key": "jafar",
        "operator": "Equal",
        "value": "iago"
      }
    ]
  }
}
```

Then I consulted about how I could achieve what I desired with a simple [`kubectl run` command](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#run), which led me to the `overrides` flag. Therefore, this is the final command:

```shell
kubectl -n development run  --overrides='{ "spec": { "nodeSelector": { "lifecycle": "Ec2Spot" }, "tolerations": [ { "effect": "NoSchedule", "key": "jafar", "operator": "Equal", "value": "iago" } ] } }' tmp-shell --rm -i --tty --image nicolaka/netshoot -- /bin/bash
```

Finally, I could run `nmap` and check the connection:

```shell
▶ nmap -v -p 5432 -Pn --open purpose-department-project-environment.cluster-ro-agrabah.us-east-1.rds.amazonaws.com
Starting Nmap 7.80 ( https://nmap.org ) at 2022-04-11 18:33 -03
Initiating Parallel DNS resolution of 1 host. at 18:33
Completed Parallel DNS resolution of 1 host. at 18:33, 0.17s elapsed
Initiating Connect Scan at 18:33
Scanning purpose-department-project-environment.cluster-ro-agrabah.us-east-1.rds.amazonaws.com (X.X.X.X) [1 port]
Discovered open port 6379/tcp on X.X.X.X
Completed Connect Scan at 18:33, 0.17s elapsed (1 total ports)
Nmap scan report for purpose-department-project-environment.cluster-ro-agrabah.us-east-1.rds.amazonaws.com (X.X.X.X)
Host is up (0.17s latency).

PORT     STATE SERVICE
6379/tcp open  redis

Read data files from: /usr/bin/../share/nmap
Nmap done: 1 IP address (1 host up) scanned in 0.55 seconds
```

I hope this may help you. See you 😄!
