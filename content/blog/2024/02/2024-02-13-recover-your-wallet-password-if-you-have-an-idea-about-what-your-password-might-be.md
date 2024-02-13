---
id: 3de77d60-cab0-11ee-8e31-9db6dc5c110d
title: Recover your wallet password if you have an idea about what your password
  might be
date: 2024-02-13T22:02:05.058Z
cover: /assets/posts/blog-39-recover-your-wallet-password-if-you-have-an-idea-about-what-your-password-might-be.png
description: Did you forget your password? Have you tried many times to open
  your wallet without success, though you remember parts of the password?
  BTCRecover can help you with this.
tags:
  - cryptocurrency
  - bitcoin
---
Let's use [BTCRecover](https://btcrecover.readthedocs.io/en/latest/). [Download the project](https://github.com/willianantunes/tutorials/tree/master/2024/02/btcrecover) and execute:

```shell
docker-compose run --rm recover bash
```

Let's say you think your password has the following properties:

* It has the word **wig**.
* It has the word **salt**.
* It may separate each word with a dot, comma, or underscore.
* It may add the year at the end of the password.

To explore how we can express these four properties in terms of configuration, create the file `possible-tokens.txt` with the following content:

```
wig
salt
```

Let's see what it means for BTCRecover by executing:

```shell
python btcrecover.py --listpass --tokenlist possible-tokens.txt
```

It returns the following:

```
wig
salt
saltwig
wigsalt
4 password combinations
```

If you add the flag `typos-capslock`, it tries the password with caps lock turned on, so if we issue:

```shell
python btcrecover.py --listpass --typos-capslock --tokenlist possible-tokens.txt
```

It returns the following result:

```
wig
WIG
salt
SALT
saltwig
SALTWIG
wigsalt
WIGSALT
8 password combinations
```

OK. Let's add the third property in the tokens file:

```
wig
salt
. , _
```

If you test to list passwords again (this time without the caps-lock flag) it returns the following:

```
wig
salt
saltwig
wigsalt
.
.wig
wig.
.salt
salt.
.saltwig
.wigsalt
salt.wig
saltwig.
wig.salt
wigsalt.
,
,wig
wig,
,salt
salt,
,saltwig
,wigsalt
salt,wig
saltwig,
wig,salt
wigsalt,
_
_wig
wig_
_salt
salt_
_saltwig
_wigsalt
salt_wig
saltwig_
wig_salt
wigsalt_
37 password combinations
```

The problem is that some combinations do not make sense. Let's remove those combinations with the following tokens file:

```
wig
salt
^,^. ^,^, ^,^_
```

With the positional anchors, we guarantee that a dot, comma, and underscore only appear in the middle of the words:

```
wig
salt
saltwig
wigsalt
salt.wig
wig.salt
salt,wig
wig,salt
salt_wig
wig_salt
10 password combinations
```

Finally, let's add the last property of the password. Let's say the year is 2000:

```
wig
salt
^,^. ^,^, ^,^_
2000$
```

If we run the test, it returns:

```
wig
salt
saltwig
wigsalt
salt.wig
wig.salt
salt,wig
wig,salt
salt_wig
wig_salt
2000
wig2000
salt2000
saltwig2000
wigsalt2000
wig.2000
salt.2000
salt.wig2000
saltwig.2000
wig.salt2000
wigsalt.2000
wig,2000
salt,2000
salt,wig2000
saltwig,2000
wig,salt2000
wigsalt,2000
wig_2000
salt_2000
salt_wig2000
saltwig_2000
wig_salt2000
wigsalt_2000
33 password combinations
```

If you don't know the year, you can change `2000$` to `%4d$` instead. It means 230010 password combinations 🤯.

**Here are two essential tips**: Depending on how many combinations your configuration has, your computer's memory won't be able to keep the program running. In this case, add the flag `--no-dupchecks` ([know why](https://btcrecover.readthedocs.io/en/latest/Limitations_and_Caveats/#memory)). It's also recommended to add the flags `--typos-swap --typos-case --typos-closecase --typos-repeat --typos-delete`. Try them out 😁!

Know all the possible configurations in the [BTCRecover guide](https://btcrecover.readthedocs.io/en/latest/tokenlist_file/) and [its examples](https://github.com/willianantunes/btcrecover/tree/master/docs/Usage_Examples).
