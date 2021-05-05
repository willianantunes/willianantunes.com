---
id: 48b4e9e0-add4-11eb-9275-f18640e3ae22
title: The easiest way to run a container on GCE with Terraform
date: 2021-05-05T19:01:23.041Z
cover: /assets/posts/blog-3-container-gce-terraform.png
description: Nothing like a quick setup with Terraform to make your application
  available. There are many ways to deploy it, but how about using Google
  Compute Engine with the cheapest machine and using a container image? Let's
  see how!
tags:
  - terraform
  - containers
  - gcp
---
Recently I developed a worker that would listen to published tasks through a database. For this sole purpose, I used [Django Q](https://django-q.readthedocs.io/en/latest/). When I finished its development, I started wondering how I would enable it in production. As my whole stack is on GCP for personal projects, I found an exciting way to deploy it with Google Compute Engine using a container image. Let's see how we can do it pretty quickly with the help of [Terraform](https://github.com/hashicorp/terraform).

## Some limits you must be aware of before we start

There are [some limitations](https://cloud.google.com/compute/docs/containers/deploying-containers#limitations) that you should pay attention to before spending any time on this solution. These two, in particular, can bring trouble to you:

* You can only deploy one container for each VM instance. Consider Google Kubernetes Engine if you need to deploy multiple containers per VM instance.
* You can only deploy containers from a public repository or from a private Container Registry repository that you have access to. Other private repositories are not supported.

In our example, I'll use a private image from [Container Registry](https://cloud.google.com/container-registry), and for that, we'll need a user that can read and download it.

## How to create a service account that can download images on Container Registry

You can [create a service account with Terraform](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/google_service_account) too, but let's stick with the command line. To make the account, you can issue the following:

```shell
gcloud iam service-accounts create custom-gce-dealer \
--display-name "Custom GCE Dealer"
```

You must check which storage is used for your container registry. Let's suppose it's `artifacts.agrabah-project.appspot.com`. Then you can execute the following command, using the generated ID for your service account:

```shell
gsutil iam ch \
serviceAccount:custom-gce-dealer@agrabah-project.iam.gserviceaccount.com:roles/storage.objectViewer \
gs://artifacts.agrabah-project.appspot.com
```

That's all we need to check out images from the container registry.

## Terraform manifests

I've found a [module that handles the metadata needed to set up the container configuration for the resource google_compute_instance](https://github.com/terraform-google-modules/terraform-google-container-vm). Let's use it to create our own module; thus, our `main.tf` file will not be immense and difficult to understand. First, let's start a project with the following structure:

```
root-folder-of-your-project/ <--- Main project
│
├── gce-with-container/  <--- Our custom module
|   |
│   ├── main.tf
│   └── variables.tf
│
├── main.tf <--- We'll use gce-with-container here
├── terraform.tfvars <--- Values for what we defined in variables.tf
├── variables.tf <--- terraform.tfvars has the values for each defined variables
└── versions.tf  <-- Here you will find the terraform block which specifies the required provider version and required Terraform version for this configuration
```

### Custom module

The folder `gce-with-container` contains our custom module. I've checked [all the examples available on terraform-google-container-vm](https://github.com/terraform-google-modules/terraform-google-container-vm/tree/5e69eafaaaa8302c5732799e32d1da5c17b7b285/examples) to create my own. Let's see how it's defined the `main.tf`:

```ruby
locals {
  # https://www.terraform.io/docs/language/values/locals.html
  instance_name = format("%s-%s", var.instance_name, substr(md5(module.gce-container.container.image), 0, 8))

  env_variables = [for var_name, var_value in var.env_variables : {
    name = var_name
    value = var_value
  }]
}

####################
##### CONTAINER SETUP

module "gce-container" {
  # https://github.com/terraform-google-modules/terraform-google-container-vm
  source = "terraform-google-modules/container-vm/google"
  version = "~> 2.0"

  container = {
    image = var.image
    command = var.custom_command
    env = local.env_variables
    securityContext = {
      privileged : var.privileged_mode
    }
    tty : var.activate_tty
  }

  restart_policy = "Always"
}

####################
##### COMPUTE ENGINE

resource "google_compute_instance" "vm" {
  name = local.instance_name
  # gcloud compute machine-types list | grep micro | grep us-central1-a
  # e2-micro / 2 / 1.00
  # f1-micro / 1 / 0.60
  # gcloud compute machine-types list | grep small | grep us-central1-a
  # e2-small / 2 / 2.00
  # g1-small / 1 / 1.70
  machine_type = "f1-micro"
  # If true, allows Terraform to stop the instance to update its properties.
  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = module.gce-container.source_image
    }
  }

  network_interface {
    network = var.network_name

    access_config {}
  }

  metadata = {
    gce-container-declaration = module.gce-container.metadata_value
  }

  labels = {
    container-vm = module.gce-container.vm_container_label
  }

  service_account {
    email = var.client_email
    scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}
```

I created some custom variables (see the file `variables.tf`) and a helper to make the configuration of environment variables easier (see `locals.env_variables`).

### Main project

Our `main.tf` file in our root folder has the boilerplate part that configures the provider (see `variables.tf` and `terraform.tfvars`) and the module we created previously. I'm only using the variable `custom_command` because the container image I provided already has a [CMD entry](https://docs.docker.com/engine/reference/builder/#cmd) on its Dockerfile; thus, it must be overridden.

```ruby
provider "google" {
  project = var.project
  credentials = file(var.credentials_file)
  region = var.region
  zone = var.zone
}

module "gce-worker-container" {
  source = "./gce-with-container"

  image = "gcr.io/${var.project}/jafar@sha256:6b71cebad455dae81af9fcb87a4c8b5bca2c2b6b2c09cec21756acd0f1ae7cec"
  privileged_mode = true
  activate_tty = true
  custom_command = [
    "./scripts/start-worker.sh"
  ]
  env_variables = {
    Q_CLUSTER_WORKERS = "2"
    DB_HOST = "your-database-host"
    DB_PORT = "5432"
    DB_ENGINE = "django.db.backends.postgresql"
    DB_NAME = "db_production"
    DB_SCHEMA = "jafar_prd"
    DB_USER = "role_jafar_prd"
    DB_PASS = "this-is-my-honest-password"
    DB_USE_SSL = "True"
  }
  instance_name = "jafar-worker"
  network_name = "default"
  # This has the permission to download images from Container Registry
  client_email = "custom-gce-dealer@${var.project}.iam.gserviceaccount.com"
}
```

That's it! You can type `terraform init` at the root folder and then `terraform apply` followed by your confirmation. It's a good idea to access the created VM and check if everything is okay through the command `docker logs`.

![It shows the result of the docker command after the machine is up and running](/assets/posts/blog-3-image-1.png "Container running properly")

If you see the container with the image `gcr.io/gce-containers/konlet:v.0.11-latest`, you don't have to worry 👀. It's the job responsible for downloading the one you configured 😅.

In this article I used Terraform v0.14.9. [You can check the entire code out on GitHub](https://github.com/willianantunes/tutorials/tree/master/2021/05/gce-container-terraform). Don't forget to execute `terraform destroy` after your test! See you next time ✌.