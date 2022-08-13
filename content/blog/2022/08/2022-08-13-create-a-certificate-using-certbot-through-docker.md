---
id: 5a92b2d0-1b3a-11ed-b4c1-171bbbb9c54c
title: Create a certificate using Certbot through Docker
date: 2022-08-13T19:01:36.041Z
cover: /assets/posts/blog-29-create-a-certificate-using-certbot-through-docker.png
description: Understand an easy way of creating a valid certificate through
  Docker. Then, you can import it to AWS Certificate Manager and use it on your
  website.
tags:
  - certbot
  - docker
  - certificate
  - cloudfront
  - s3
---
One of the projects I had to deal with recently was close to the following architecture:

![The technical architecture shows three actors: a person, the CDN (content delivery network), and a bucket S3. It shows the process of retrieving an asset through HTTP GET.](/assets/posts/blog-29-order-1-image-1-architecture.png "Architecture")

The red part is where you make an HTTP request. You usually do it with an HTTPS endpoint through a custom domain. So, instead of using the CloudFront address, let's say `d7w4qdbq7iqgl.cloudfront.net`, you use a custom one like `assets.amazonplayground.willianantunes.com`.

As I was using my own account to test the whole architecture, I tried to avoid costs as much as possible. One of the things I could do was import the certificate for the custom domain. According to [ACM pricing](https://aws.amazon.com/certificate-manager/pricing/), you pay 0.75 USD per certificate, which means something close to 4 BRL (my country's currency), and you only pay for it if the certificate is issued by AWS. Thus, let's issue our own certificate using [Cerbot](https://certbot.eff.org/) and import it to ACM. 

## Certbot as Compose service

Reading the [Certbot User Guide](https://eff-certbot.readthedocs.io/en/stable/using.html), we'll see the following directories are essential:

* [`/etc/letsencrypt`](https://eff-certbot.readthedocs.io/en/stable/using.html#where-are-my-certificates): All generated keys and issued certificates can be found in this folder.
* [`/var/lib/letsencrypt`](https://eff-certbot.readthedocs.io/en/stable/using.html#id5): Where some of the lock files are stored.
* [`/var/log/letsencrypt`](https://eff-certbot.readthedocs.io/en/stable/using.html#log-rotation): Status logs can be found in this folder.

Let's use them as volume to create the compose service:

```yaml
version: "3.8"

services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./etc-letsencrypt:/etc/letsencrypt
      - ./var-lib-letsencrypt:/var/lib/letsencrypt
      - ./var-log-letsencrypt:/var/log/letsencrypt
```

Now, if we execute the command:

```shell
docker-compose run certbot --help
```

That's the output:

```text
Creating network "certbot-terraform-s3-cloudfront_default" with the default driver
Creating certbot-terraform-s3-cloudfront_certbot_run ... done

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  certbot [SUBCOMMAND] [options] [-d DOMAIN] [-d DOMAIN] ...

Certbot can obtain and install HTTPS/TLS/SSL certificates.  By default,
it will attempt to use a webserver both for obtaining and installing the
certificate. The most common SUBCOMMANDS and flags are:

obtain, install, and renew certificates:
    (default) run   Obtain & install a certificate in your current webserver
    certonly        Obtain or renew a certificate, but do not install it
    renew           Renew all previously obtained certificates that are near
expiry
    enhance         Add security enhancements to your existing configuration
   -d DOMAINS       Comma-separated list of domains to obtain a certificate for

  (the certbot apache plugin is not installed)
  --standalone      Run a standalone webserver for authentication
  (the certbot nginx plugin is not installed)
  --webroot         Place files in a server's webroot folder for authentication
  --manual          Obtain certificates interactively, or using shell script
hooks

   -n               Run non-interactively
  --test-cert       Obtain a test certificate from a staging server
  --dry-run         Test "renew" or "certonly" without saving any certificates
to disk

manage certificates:
    certificates    Display information about certificates you have from Certbot
    revoke          Revoke a certificate (supply --cert-name or --cert-path)
    delete          Delete a certificate (supply --cert-name)

manage your account:
    register        Create an ACME account
    unregister      Deactivate an ACME account
    update_account  Update an ACME account
    show_account    Display account details
  --agree-tos       Agree to the ACME server's Subscriber Agreement
   -m EMAIL         Email address for important account notifications

More detailed help:

  -h, --help [TOPIC]    print this message, or detailed help on a topic;
                        the available TOPICS are:

   all, automation, commands, paths, security, testing, or any of the
   subcommands or plugins (certonly, renew, install, register, nginx,
   apache, standalone, webroot, etc.)
  -h all                print a detailed help page including all topics
  --version             print the version number
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

## Creating the certificate through domain validation

We'll use the [manual approach](https://eff-certbot.readthedocs.io/en/stable/using.html#manual) to get the certificate with the DNS challenge. The command below has the `--dry-run` flag. Remove it when you feel the result is fine:

```shell
docker-compose run certbot certonly -d assets.amazonplayground.willianantunes.com \
--manual --preferred-challenges dns --dry-run
```

You'll see something like the following:

```text
Please deploy a DNS TXT record under the name:

_acme-challenge.assets.amazonplayground.willianantunes.com.

with the following value:

HIRw2QxqFowxWUQS9_te5Irxog10Nom-yjuj1uVn_oM

Before continuing, verify the TXT record has been deployed. Depending on the DNS
provider, this may take some time, from a few seconds to multiple minutes. You can
check if it has finished deploying with aid of online tools, such as the Google
Admin Toolbox: https://toolbox.googleapps.com/apps/dig/#TXT/_acme-challenge.assets.amazonplayground.willianantunes.com.
Look for one or more bolded line(s) below the line ';ANSWER'. It should show the
value(s) you've just added.
```

That's the part where we have to create a TXT DNS record. When this step is complete and validated, that's what we'll see:

```text
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/assets.amazonplayground.willianantunes.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/assets.amazonplayground.willianantunes.com/privkey.pem
This certificate expires on 2022-10-01.
These files will be updated when the certificate renews.

NEXT STEPS:
- This certificate will not be renewed automatically. Autorenewal of --manual certificates requires the use of an authentication hook script (--manual-auth-hook) but one was not provided. To renew this certificate, repeat this same certbot command before the certificate's expiry date.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
```

Files that have been created during the process:

```text
├── docker-compose.yaml
├── etc-letsencrypt
│   ├── accounts
│   │   └── acme-v02.api.letsencrypt.org
│   │       └── directory
│   │           └── 45fd542d766c363fceecfcf4eaeb6cb0
│   │               ├── meta.json
│   │               ├── private_key.json
│   │               └── regr.json
│   ├── archive
│   │   └── assets.amazonplayground.willianantunes.com
│   │       ├── cert1.pem
│   │       ├── chain1.pem
│   │       ├── fullchain1.pem
│   │       └── privkey1.pem
│   ├── csr
│   │   └── 0000_csr-certbot.pem
│   ├── keys
│   │   └── 0000_key-certbot.pem
│   ├── live
│   │   ├── assets.amazonplayground.willianantunes.com
│   │   │   ├── cert.pem -> ../../archive/assets.amazonplayground.willianantunes.com/cert1.pem
│   │   │   ├── chain.pem -> ../../archive/assets.amazonplayground.willianantunes.com/chain1.pem
│   │   │   ├── fullchain.pem -> ../../archive/assets.amazonplayground.willianantunes.com/fullchain1.pem
│   │   │   ├── privkey.pem -> ../../archive/assets.amazonplayground.willianantunes.com/privkey1.pem
│   │   │   └── README
│   │   └── README
│   ├── renewal
│   │   └── assets.amazonplayground.willianantunes.com.conf
│   └── renewal-hooks
│       ├── deploy
│       ├── post
│       └── pre
├── var-lib-letsencrypt
│   └── backups
└── var-log-letsencrypt
    ├── letsencrypt.log
    └── letsencrypt.log.1
```

We are ready to import the signed certificate into AWS Certificate Manager 😛!

## Importing Certbot certificate into ACM using Terraform

Having the file `main.tf` in the folder where is the compose file, that's the resource we can configure:

```ruby
resource "aws_acm_certificate" "cert_assets_amazonplayground" {
  private_key       = file("${path.module}/etc-letsencrypt/live/assets.amazonplayground.willianantunes.com/privkey.pem")
  certificate_body  = file("${path.module}/etc-letsencrypt/live/assets.amazonplayground.willianantunes.com/cert.pem")
  certificate_chain = file("${path.module}/etc-letsencrypt/live/assets.amazonplayground.willianantunes.com/fullchain.pem")
}
```

This is enough to import the certificate into ACM. Then, as an example, we can apply it on CloudFront, referencing the ACM resource:

```ruby
resource "aws_cloudfront_distribution" "cdn" {
  # A bunch of code...

  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.cert_assets_amazonplayground.arn
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1"
    ssl_support_method             = "sni-only"
  }
}
```

[Look at the whole code](https://github.com/willianantunes/tutorials/blob/5c03611e5fe077996327b4273dcae4e1d4692173/2022/08/certbot-terraform-s3-cloudfront/main.tf).

## Conclusion

Certbot is a very intuitive and easy program to use. As I say to my coworkers, we don't need to install most of the tools to do our jobs in our machines. With containers, we can simply fire up a container and do the job from there. This is not always true, though. I recommend reading the [Certbot documentation](https://eff-certbot.readthedocs.io/en/stable/install.html#running-with-docker) where this issue is briefly discussed.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/08/certbot-terraform-s3-cloudfront).

Posted listening to [Trem das Onze, Os Originais do Samba](https://www.youtube.com/watch?v=sxk3d9qWTBc&t=1619s) 🎶.
