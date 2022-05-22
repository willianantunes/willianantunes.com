---
id: 1d2c2410-da00-11ec-84d2-2f1f93794441
title: Rundeck playground environment on Kubernetes
date: 2022-05-22T19:13:09.407Z
cover: /assets/posts/blog-25-rundeck-playground-environment-on-kubernetes.png
description: Have your own Rundeck playground environment on localhost
  Kubernetes! Learn how it works, invoke automation, and many more!
tags:
  - rundeck
  - k8s
  - automation
  - kind
  - postgresql
---
Shorter incidents? Fewer escalations? That's something you can only understand playing the real thing. So let's see Rundeck in action on Kubernetes! By the way, we'll use [Rundeck Kubernetes Plugin](https://github.com/rundeck-plugins/kubernetes) to run our jobs on pods.

**A very important notice:** You can always stick with Helm, but [there is no official chart](https://github.com/rundeck/rundeck/issues/6619). You can use the [deprecated one](https://github.com/helm/charts/tree/master/incubator/rundeck) or [another](https://github.com/EugenMayer/helm-charts) that's been trying to be up to date. However, I think it's crucial to comprehend the whole thing behind the curtain.

## What you need to have before going on

We'll use [kind](https://kind.sigs.k8s.io/) to create our local Kubernetes clusters. The nodes will run on [Docker](https://docs.docker.com/get-docker/), so you'll need it too. Finally, we'll run some commands to deploy manifests on K8S using [kubectl](https://kubernetes.io/docs/tasks/tools/). I have [this script](https://github.com/willianantunes/personal-environment/blob/92d4ba18bfd244cbfa9c5812b4c74a41f6c94a87/src/utils/must_have_packages.sh) where you can copy and paste exactly what you need. All things said, let's continue.

## Create a Rundeck image locally

Download the repository [willianantunes/tutorials](https://github.com/willianantunes/tutorials) and access the folder `2022/05/rundeck-k8s`. Run the command:

```shell
cd rundeck-custom-image && docker build -t rundeck-k8s . && cd ..
```

We'll use this image on Kubernetes soon 😋. There are some comments here and there and a [README](https://github.com/willianantunes/tutorials/tree/master/2022/05/rundeck-k8s/rundeck-custom-image/remco) explaining Remco. We can check out [the official documentation](https://docs.rundeck.com/docs/administration/configuration/docker/extending-configuration.html#configuration-layout) also.

## Create a Kubernetes cluster

To configure some aspects as port forwarding, we'll use a custom setup to change the default kind cluster creation. Let's run this command:

```shell
kind create cluster --config kind-config.yaml
```

That's the output:

```shell
▶ kind create cluster --config kind-config.yaml
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.24.0) 🖼
 ✓ Preparing nodes 📦 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
 ✓ Joining worker nodes 🚜 
Set kubectl context to "kind-kind"
You can now use your cluster with:

kubectl cluster-info --context kind-kind

Have a nice day! 👋
```

Check out the ports we'll use to connect to Rundeck and PostgreSQL!

```shell
▶ docker ps
CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS         PORTS                                                NAMES
efdab88979a4   kindest/node:v1.24.0   "/usr/local/bin/entr…"   5 minutes ago   Up 5 minutes   127.0.0.1:42595->6443/tcp, 127.0.0.1:80->32000/tcp   localtesting-control-plane
10312a74eb6b   kindest/node:v1.24.0   "/usr/local/bin/entr…"   5 minutes ago   Up 5 minutes
```

## Sanity check

Do you know what happens when you delete a namespace? Can you imagine doing it in your company's cluster? So, it's crucial making sure you are using the proper context created by kind:

```shell
▶ kubectl config current-context
kind-kind
```

## Create a dedicated namespace

We'll have a namespace responsible for support tools. So, let's create one and make it the default from now on.

```shell
kubectl create namespace support-tools
kubectl config set-context --current --namespace=support-tools
```

## Load the Rundeck image into the Kubernetes cluster

To enable the cluster using the image we had built, we can use the following [kind command](https://kind.sigs.k8s.io/docs/user/quick-start/#loading-an-image-into-your-cluster):

```shell
kind load docker-image rundeck-k8s:latest
```

You can get a list of images present on a cluster node by using the following commands:

```shell
docker exec -it kind-worker crictl images
docker exec -it kind-control-plane crictl images
```

## Install all the required manifests

I recommend leaving this enabled in one dedicated terminal:

```shell
kubectl get events -w
```

Then we can create the required manifest: 

```shell
kubectl apply -f k8s-manifests/0-database.yaml
kubectl apply -f k8s-manifests/1-permissions.yaml
kubectl apply -f k8s-manifests/2-secrets-and-configmap.yaml
```

When PostgreSQL is fine, we should be good to go to the final step. See the logs to make sure:

```shell
kubectl logs -f deployment/db-postgres-deployment
```

## Install Rundeck

Just issue the following command:

```shell
kubectl apply -f k8s-manifests/3-service-and-deployment.yaml
```

It's important checking out the logs in case something wrong occurs:

```shell
kubectl logs -f deployment/rundeck-k8s-deployment
```

Wait a few minutes until you see this:

```
[2022-05-22T17:45:57,279] INFO  rundeckapp.Application - Started Application in 153.59 seconds (JVM running for 162.918)
Grails application running at http://0.0.0.0:4440/ in environment: production
```

You should be able to access `http://localhost:8000/`. Use `admin` for username and password. That's the logged landing page:

![It shows the logged landing page on Rundeck.](/assets/posts/blog-25-order-1-image-1-rundeck-landing-page.png "Rundeck logged landing page.")

### Explaining why we use Init Containers

Later we'll see we won't configure any authentication to run our jobs on Kubernetes. This will happen because Rundeck will use the kubeconfig found in `~/.kube/config`. As the deployment has a service account attached, Kubernetes makes sure each pod spawned by it has a volume with the service account credentials. Thus we merely create the file through kubectl and use a volume to share it with the main container.

## Rundeck in Action with K8S plugin

Let's import the following jobs definitions:

* Create database.
* Create schema in a database.
* Create a user with DDL, DML, and DQL permissions in a dedicated database and schema.

But before doing this, we need a project to import the manifests. So click on `create new project`, leave as the image below and click on `create`:

![To create a new project on Rundeck, you basically need its name and label.](/assets/posts/blog-25-order-1-image-2-rundeck-new-project.png "Create a new project page.")

On your left, click on `jobs` and then click on `upload a job definition`:

![The "all jobs pages" has two highlighted buttons: "create a new job" and "upload a job definition". To import a job definition, you should click on the latter.](/assets/posts/blog-25-order-1-image-3-import-job.png "List of all jobs page.")

Select `YAML format`, then import the files located here. By the end of the process, you'll have the following:

![After importing the three jobs, they are available on the "all jobs" page.](/assets/posts/blog-25-order-1-image-4-jobs.png "Three imported jobs.")

Now click on `Create database` and type `db_prd`. Finally, click on `Run Job Now`.

![The "create database" job required the database name to be run.](/assets/posts/blog-25-order-1-image-5-create-database.png "Create database job.")

You can follow the execution and check out the result:

![The result shows the job had been executed successfully.](/assets/posts/blog-25-order-1-image-6-create-database-result.png "Create database job result.")

Now create a schema named `jafar` in `db_prd`:

![The "create schema" job required two parameters: target database and schema name.](/assets/posts/blog-25-order-1-image-7-create-schema.png "Create schema job.")

When it's done, create a user using `iago` for username and password in `jafar` schema and `db_prd` database.

![To create a user, the job required 4 parameters: target database, schema name, username, and password.](/assets/posts/blog-25-order-1-image-8-create-user.png "Create user job.")

The result only shows the options that are not confidential:

![The "create user" result shows the provided parameters, unless the password, which is confidential.](/assets/posts/blog-25-order-1-image-9-create-user-result.png "The create user job result.")

Do you remember the port forward we configured for PostgreSQL? How about testing the connection using the user above 🤩?

## Clean up everything

One command is enough to delete everything 😎:

```shell
kind delete cluster
```

## Conclusion

Sooner or later, your company will need a tool like Rundeck. [This story](https://youtu.be/3IucHRaaJv4) illustrates a very likely actual situation. The jobs we saw are simple samples. I invite you to edit the jobs on Rundeck and understand how it was written. There are many options available, and with the Kubernetes integration, the sky's the limit.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/05/rundeck-k8s).

Posted listening to [Bad Horsie, Steve Vai](https://youtu.be/jHubmkOe-MQ) 🎶.
