---
id: 8eb6e570-b008-11eb-89fc-9f8d53612ab0
title: "Production-ready shell startup scripts: The Set Builtin"
date: 2021-05-08T14:20:36.585Z
cover: /assets/posts/blog-4-the-set-builtin.png
description: Know another way to avoid unexpected incidents in production. It
  will allow you to write production-ready startup shell scripts. Learn about
  The Set Builtin.
tags:
  - bash
  - shell
  - scripts
---
When you build an application and make it available through container technology, either you have an [ENTRYPOINT](https://docs.docker.com/engine/reference/builder/#entrypoint) or [CMD](https://docs.docker.com/engine/reference/builder/#cmd) instructions at the end of its Dockerfile. Depending on which framework you're using and some requirements you have, sometimes it's better to have a bash script responsible for running your project. When it's available, generally, you'll see a bunch of commands that are executed, like [the following script I created for the project Django Multiple Schemas](https://github.com/willianantunes/django-multiple-schemas/blob/9b44d21c31c51b86d7089ac429fff8a14f8899b6/scripts/start-development.sh):

```shell
#!/usr/bin/env bash

python manage.py makemigrations
python manage.py migrate
python manage.py seed --create-super-user

python manage.py runserver 0.0.0.0:8000
```

Let's suppose the command `python manage.py migrate` failed its execution. What would happen 🤔? The answer is counter-intuitive, but the script would run fine, even with the error 🤯. It would execute the command `python manage.py seed --create-super-user` followed by `python manage.py runserver 0.0.0.0:8000`. How to fix that? Let's know a bit about some arguments of [The Set Builtin](https://www.gnu.org/software/bash/manual/bash.html#The-Set-Builtin).

## Exit immediately if any command returns a non-zero status

Let's suppose the following script:

```shell
#!/usr/bin/env bash

python the_set_builtin/sample_1.py
python the_set_builtin/sample_2_force_error.py
python the_set_builtin/sample_3.py
```

If we execute it, we'll have the following output:

```shellsession
▶ docker-compose up why-use-argument-e-with-bug
Creating the-set-builtin_why-use-argument-e-with-bug_1 ... done
Attaching to the-set-builtin_why-use-argument-e-with-bug_1
why-use-argument-e-with-bug_1  | I am the /app/the_set_builtin/sample_1.py!
why-use-argument-e-with-bug_1  | I am the /app/the_set_builtin/sample_2_force_error.py!
why-use-argument-e-with-bug_1  | Let me force an error 👀
why-use-argument-e-with-bug_1  | I am the /app/the_set_builtin/sample_3.py!
the-set-builtin_why-use-argument-e-with-bug_1 exited with code 0
```

The exit code is 0 😠. Now, if you include the option `set -e` and execute it again, the output changes, fixing the unexpected behavior:

```shellsession
▶ docker-compose up why-use-argument-e-with-fix 
Creating the-set-builtin_why-use-argument-e-with-fix_1 ... done
Attaching to the-set-builtin_why-use-argument-e-with-fix_1
why-use-argument-e-with-fix_1  | I am the /app/the_set_builtin/sample_1.py!
why-use-argument-e-with-fix_1  | I am the /app/the_set_builtin/sample_2_force_error.py!
why-use-argument-e-with-fix_1  | Let me force an error 👀
the-set-builtin_why-use-argument-e-with-fix_1 exited with code 1
```

Now the exit code is 1 🥳. According to the documentation about the argument `-e`:

> Exit immediately if a pipeline, which may consist of a single simple command, a list, or a compound command returns a non-zero status.

This argument is quite good! It can protect us from bugs in production. Though it can solve many potential problems, we may need an environment variable. To illustrate, see the `PORT`:

```shell
#!/usr/bin/env bash

python manage.py migrate
python manage.py collectstatic --no-input

gunicorn -cpython:gunicorn_config -b 0.0.0.0:${PORT} aladdin.wsgi
```

If the variable is not provided, our application might be running without a critical parameter. Is there another argument that can stop the script if this variable is missing?

## Treat unset variables as an error when substituting

Now we have the following script:

```shell
#!/usr/bin/env bash

python the_set_builtin/sample_1.py
python the_set_builtin/sample_2_force_error.py
python the_set_builtin/sample_3.py
python the_set_builtin/sample_4_env_variable.py "$ALADDIN_WISH"
python the_set_builtin/sample_5.py
```

If you run, you'll get the following output:

```shellsession
▶ docker-compose up why-use-argument-u-with-bug
Starting the-set-builtin_why-use-argument-u-with-bug_1 ... done
Attaching to the-set-builtin_why-use-argument-u-with-bug_1
why-use-argument-u-with-bug_1  | I am the /app/the_set_builtin/sample_1.py!
why-use-argument-u-with-bug_1  | I am the /app/the_set_builtin/sample_2_force_error.py!
why-use-argument-u-with-bug_1  | Let me force an error 👀
why-use-argument-u-with-bug_1  | I am the /app/the_set_builtin/sample_3.py!
why-use-argument-u-with-bug_1  | I am the /app/the_set_builtin/sample_4_env_variable.py!
why-use-argument-u-with-bug_1  | Look! I received the following arguments: ['the_set_builtin/sample_4_env_variable.py', '']
why-use-argument-u-with-bug_1  | Length: 2
why-use-argument-u-with-bug_1  | I am the /app/the_set_builtin/sample_5.py!
the-set-builtin_why-use-argument-u-with-bug_1 exited with code 0
```

With the option `set -u`, here is what you get:

```shellsession
▶ docker-compose up why-use-argument-u-with-fix
Starting the-set-builtin_why-use-argument-u-with-fix_1 ... done
Attaching to the-set-builtin_why-use-argument-u-with-fix_1
why-use-argument-u-with-fix_1  | I am the /app/the_set_builtin/sample_1.py!
why-use-argument-u-with-fix_1  | I am the /app/the_set_builtin/sample_2_force_error.py!
why-use-argument-u-with-fix_1  | Let me force an error 👀
why-use-argument-u-with-fix_1  | I am the /app/the_set_builtin/sample_3.py!
why-use-argument-u-with-fix_1  | ./scripts/with-argument-u.sh: line 10: ALADDIN_WISH: unbound variable
the-set-builtin_why-use-argument-u-with-fix_1 exited with code 1
```

It's rocking 🤘! Let's see the explanation of `-u`:

> Treat unset variables and parameters other than the special parameters ‘@’ or ‘*’ as an error when performing parameter expansion. An error message will be written to the standard error, and a non-interactive shell will exit.

Including both options in our scripts (`set -eu`) and we are almost good to go! I wrote "almost" because we can add another layer of protection. Let's see the last one.

## A pipeline should produce a failure return code if any command fails

To illustrate, imagine you have the script below. Notice that we're using `set -e` argument to make it safer:

```shell
#!/usr/bin/env bash

# https://www.gnu.org/software/bash/manual/bash.html#The-Set-Builtin
# • -e:  Exit immediately if a command exits with a non-zero status.
set -e

this-is-a-fake-command-my-friend | echo "You...are late."
echo "A thousand apologies, O patient one."
```

In case the second command fails in the pipeline, here's the output:

```shellsession
▶ docker-compose up why-use-option-pipefail-with-bug
Starting the-set-builtin_why-use-option-pipefail-with-bug_1 ... done
Attaching to the-set-builtin_why-use-option-pipefail-with-bug_1
why-use-option-pipefail-with-bug_1  | ./scripts/without-option-pipefail.sh: line 7: this-is-a-fake-command-my-friend: command not found
why-use-option-pipefail-with-bug_1  | You...are late.
why-use-option-pipefail-with-bug_1  | A thousand apologies, O patient one.
the-set-builtin_why-use-option-pipefail-with-bug_1 exited with code 0
```

Including the option `set -e -o pipefail`, the output changes to the following:

```shellsession
▶ docker-compose up why-use-option-pipefail-with-fix
Starting the-set-builtin_why-use-option-pipefail-with-fix_1 ... done
Attaching to the-set-builtin_why-use-option-pipefail-with-fix_1
why-use-option-pipefail-with-fix_1  | ./scripts/with-option-pipefail.sh: line 9: this-is-a-fake-command-my-friend: command not found
why-use-option-pipefail-with-fix_1  | You...are late.
the-set-builtin_why-use-option-pipefail-with-fix_1 exited with code 127
```

Its explanation:

> If set, the return value of a pipeline is the value of the last (rightmost) command to exit with a non-zero status, or zero if all commands in the pipeline exit successfully. This option is disabled by default.

## Shield you from working outside working hours

Wrapping everything up, this is the entry your bash script should have at the top: `set -eu -o pipefail`. Always insert it in all of your scripts, always. This simple protection will help you a lot during [TSHOOT](https://www.google.com/search?q=what+is+tshoot) 🙏. One example is when you're running your application without a migration that should have been applied.

You can check out [all the code I put in this article on GitHub](https://github.com/willianantunes/tutorials/tree/master/2021/05/the-set-builtin). There you'll find a [docker-compose file](https://github.com/willianantunes/tutorials/blob/605a9bbebf5ec2857a33800275d0518155eb86e9/2021/05/the-set-builtin/docker-compose.yaml) with all the services testing each of the arguments I showed here 🤙.