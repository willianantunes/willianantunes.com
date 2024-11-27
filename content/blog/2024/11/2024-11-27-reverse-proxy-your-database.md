---
id: 79487720-ad17-11ef-b692-179c76c36fbe
title: Reverse proxy your database
date: 2024-11-27T23:29:40.262Z
cover: /assets/posts/blog-47-reverse-proxy-your-database.png
description: Reverse proxying is a technique often used to distribute incoming
  traffic across multiple servers. It can also expose private servers, such as
  databases, to the Internet. Did you know this?
tags:
  - proxy
  - postgresql
---
**Warning:** This is a note, so don't expect much 😅!

Depending on your context, you may have to expose a private server temporarily to the Internet. For example, recently, I had to expose a PostgreSQL database that runs on Azure. It uses [VNet Integration](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-networking-private) for private access. Because of that, you can't enable public access. Azure does not allow both to exist, even if you try to create a replica. You can create a new instance from a snapshot and make it public, but this still wasn't allowed in my context. I had the following options:

* Create a VPN S2S;
* Expose the TCP port of the database through a reverse proxy.

I chose the latter. It's simple but less secure than a VPN S2S, so SSL is necessary. While implementing the solution, I discovered that the [PostgreSQL database has its own handshake that precedes the SSL handshake](https://stackoverflow.com/a/65999802). NGINX does not support it. Fortunately, I found [this comment](https://serverfault.com/questions/1127529/how-to-use-nginx-as-ssl-reverse-proxy-for-postgresql-tcp-connection/1127534#comment1526190_1127534) about [PGT-Proxy](https://github.com/ambarltd/pgt-proxy). To test it, I made a [playground project](https://github.com/willianantunes/tutorials/tree/master/2024/11/reverse-proxy-expose-database) that does the following:

* [Create a ROOT CA, a certificate, and so on for the PostgreSQL](https://github.com/willianantunes/tutorials/blob/master/2024/11/reverse-proxy-expose-database/postgres-initdb/configure-certs.sh).
* [Initiate the PostgreSQL database with SSL activated](https://github.com/willianantunes/tutorials/blob/master/2024/11/reverse-proxy-expose-database/postgres-initdb/initialize.sql).
* [Create a certificate for PGT-Proxy](https://github.com/willianantunes/tutorials/blob/bfa7cf4603fc2c0b87a22bbfb6bef70b2e68ad28/2024/11/reverse-proxy-expose-database/pgt-proxy-startup.sh#L8-L15).
* The routine connects to the database through the [openssl command](https://github.com/willianantunes/tutorials/blob/bfa7cf4603fc2c0b87a22bbfb6bef70b2e68ad28/2024/11/reverse-proxy-expose-database/pgt-proxy-startup.sh#L17-L34) and downloads the certificate chain, which includes the CA.
* [PGT-Proxy starts on port 9000](https://github.com/willianantunes/tutorials/blob/bfa7cf4603fc2c0b87a22bbfb6bef70b2e68ad28/2024/11/reverse-proxy-expose-database/pgt-proxy-startup.sh#L39) with the created certificate and [uses the downloaded CA file as a trusted CA](https://github.com/willianantunes/tutorials/blob/bfa7cf4603fc2c0b87a22bbfb6bef70b2e68ad28/2024/11/reverse-proxy-expose-database/pgt-proxy-startup.sh#L43).
* The compose file has the [ORIGIN_SERVER_ADDRESS](https://github.com/willianantunes/tutorials/blob/bfa7cf4603fc2c0b87a22bbfb6bef70b2e68ad28/2024/11/reverse-proxy-expose-database/docker-compose.yaml#L15) environment variable. The default value is db, but you can set your RDS database address as an example.

This is the script that starts PGT-Proxy:

```shell
#!/usr/bin/env bash

set -e

# https://docs.openssl.org/master/man5/x509v3_config/#extended-key-usage
# https://docs.openssl.org/master/man5/x509v3_config/#key-usage
# https://superuser.com/a/1248085
echo "Generating self-signed certificate for the proxy server"
openssl req -x509 -out self_issued_cert.pem -keyout self_issued_key.pem \
  -days 365 \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth") && \
   chmod 644 self_issued_cert.pem && \
   chmod 600 self_issued_key.pem

ORIGIN_SERVER_ADDRESS=${ORIGIN_SERVER_ADDRESS:-db}
ORIGIN_SERVER_PORT=${ORIGIN_SERVER_PORT:-5432}
echo "You set the origin server address to $ORIGIN_SERVER_ADDRESS and port to $ORIGIN_SERVER_PORT"

# CAS_FOLDER=/etc/pgt_proxy/client_tls/aws_rds/
# CAS_FOLDER=/etc/pgt_proxy/client_tls/firefox/
CAS_FOLDER=/etc/pgt_proxy/client_tls/custom_cas
mkdir -p $CAS_FOLDER

# https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-networking-ssl-tls#download-root-ca-certificates-and-update-application-clients-in-certificate-pinning-scenarios
# openssl s_client -starttls postgres -showcerts -connect $ORIGIN_SERVER_ADDRESS:$ORIGIN_SERVER_PORT
# openssl s_client -starttls postgres -showcerts -connect localhost:5432
echo "Retrieving the origin server's CA certificate"
ORIGIN_CERTS=$(openssl s_client -starttls postgres -showcerts -connect $ORIGIN_SERVER_ADDRESS:$ORIGIN_SERVER_PORT < /dev/null 2>/dev/null | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p')
echo "$ORIGIN_CERTS" | awk 'BEGIN {c=0;} /-BEGIN CERTIFICATE-/{c++} {print > "ca-" c ".pem"}'
cp ca-*.pem $CAS_FOLDER
chmod 600 $CAS_FOLDER/*
ls -la $CAS_FOLDER

echo "Starting the proxy server..."
/etc/pgt_proxy/run --server-private-key-path ./self_issued_key.pem \
--server-certificate-path ./self_issued_cert.pem \
--server-port 9000 \
--client-connection-host-or-ip $ORIGIN_SERVER_ADDRESS \
--client-connection-port $ORIGIN_SERVER_PORT \
--client-tls-validation-host $ORIGIN_SERVER_ADDRESS \
--client-ca-roots-path $CAS_FOLDER \
--log TRACE
```

It wasn't working at first. [I even opened an issue in the main repository](https://github.com/ambarltd/pgt-proxy/issues/4), but I was able to solve it.

I hope this may help you. See you! 😄
