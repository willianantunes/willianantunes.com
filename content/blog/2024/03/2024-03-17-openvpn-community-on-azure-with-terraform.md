---
id: fee6dce0-e4aa-11ee-bcbf-c349a4fc71c6
title: OpenVPN Community on Azure with Terraform
date: 2024-03-17T22:30:18.793Z
cover: /assets/posts/blog-42-openvpn-community-on-azure-with-terraform.png
description: Are you learning how to configure an OpenVPN server on Azure? Need
  help figuring out where to start? Comprehend where to begin with a sample
  project.
tags:
  - openvpn
  - point-to-site-vpn
  - terraform
---
**Warning:** This is a note, so don't expect much 😅!

I've been creating an entire infrastructure from scratch on Azure. All components are private. One convenient way to access the private resources is through the bastion. However, it's costly. Another interesting way to access the environment is through a VPN server using [P2S](https://learn.microsoft.com/en-us/azure/vpn-gateway/point-to-site-about).

I found an excellent project provided by [dumrauf](https://github.com/dumrauf/openvpn-terraform-install) where you can quickly create an OpenVPN server using Terraform, focused on AWS, though 😨. I've adapted the code to work on Azure 😛. Here are important notes if you want to use it:

* The OpenVPN server is installed using [Virtual Machine Extension](https://learn.microsoft.com/en-us/azure/virtual-machines/extensions/overview). It uses the script [`openvpn.sh`](https://github.com/willianantunes/tutorials/blob/master/2024/03/openvpn-dns/openvpn.sh).
* The installation script provides the file `openvpn-management.sh` to manage the OpenVPN server. It's available in the user's home directory.
* When you access the VPN server, for example, through the [serial console](https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/serial-console-overview), you can generate OVPN files, list what has been generated, and revoke them through the management script. Just execute `sudo ./openvpn-management.sh`.
* AKS is provisioned. If you don't need it, remove it before applying the Terraform script.
* Terraform provisions a hub-spoke network topology. I used it for a test I had been doing. It's another thing that can be removed unless you want to test it.

Check out the [whole project on GitHub](https://github.com/willianantunes/tutorials/tree/master/2024/03/openvpn-dns) if you have any further questions.

I hope this may help you. See you 😄!
