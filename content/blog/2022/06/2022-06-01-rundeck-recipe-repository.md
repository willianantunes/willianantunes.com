---
id: b3e46460-df75-11ec-b817-0910ae60956a
title: Rundeck recipe repository
date: 2022-06-01T08:37:44.592Z
cover: /assets/posts/blog-26-rundeck-recipe-repository.png
description: Are you having trouble creating automation? How about a recipe
  repository with everything you need? Understand this and more with this
  article!
tags:
  - rundeck
  - automation
  - django
  - python
---
Runbook automation enables you to easily translate operations knowledge into automated procedures, doesn't it? With [Rundeck Kubernetes Plugin](https://github.com/rundeck-plugins/kubernetes), it goes to another level as the plugin brings the power of containers to automation. For example, how about employing an image that contains many automation commands 🤔?

By the way, this post is a direct continuation of the last one, where I explain how you can create your own [Rundeck playground environment on Kubernetes](https://www.willianantunes.com/blog/2022/05/rundeck-playground-environment-on-kubernetes/). So having any doubts, just go there and check it out 👍.

## Explaining the solution

Imagine a recipe repository containing a project where you'd be able to easily create automation using a programming language that is easy to learn and test, also with excellent support for scripting purposes. For example, accessing its running container, you could execute the following commands:

```shell
python manage.py add_repository_sonar_cloud --repository-name willianantunes/tic-tac-toe-csharp-playground
python manage.py create_azure_devops_pipeline --repository-name raveofphonetics/comments
python manage.py create_account_cloud_amqp --user jafar@willianantunes.com
python manage.py delete_user_from_all_places --user iago@willianantunes.com
```

So yes, it would be Python and Django, and the latter using its [management command](https://docs.djangoproject.com/en/4.0/howto/custom-management-commands/) feature. Some quick wins I see with this setup:

* Using Python, in theory, you don't have to worry about where it's going to run: either Windows or Linux.
* Python is very well supported by many cloud providers. AWS has boto3, for instance.
* *Django management command* removes all the work we'd have to do to create a friendly CLI.
* The task to test the automation is simplified as you can fake complicated scenarios with the [mock object library](https://docs.python.org/3/library/unittest.mock.html).
* The knowledge base grows as more recipes/commands are added.

You may think: "but why not bare shell"? Well, [readability counts](https://www.willianantunes.com/blog/2021/05/you-should-configure-env-variables-in-one-place/#readability-counts-and-a-lot), and simple is better than complex. Depending on what you're doing, a simple bash script can be very tricky to understand if you're a developer who just uses it from time to time. The hiring process is also positively impacted, given my current context. So everything depends. All explained, let's move on.

## Add repository on SonarCloud

Let's take the first command from the sample I displayed above. The idea is to add a new repository on SonarCloud. Suppose we are using GitHub and your organization has SonarCloud installed as a GitHub App. Then to add the repository on SonarCloud:

* Add the repository in the SonarCloud App so it can see it.
* Create the project on SonarCloud.

With the help of [`PyGithub`](https://github.com/PyGithub/PyGithub/) and [`python-sonarqube-api`](https://github.com/shijl0925/python-sonarqube-api/), we can translate the flow above into the following code:

```python
import requests

from django.core.management import CommandError
from django.core.management.base import BaseCommand
from github import Github
from sonarqube import SonarCloudClient
from sonarqube.utils.exceptions import ValidationError


class Command(BaseCommand):
    help = "Add repository on Sonar Cloud"

    def add_arguments(self, parser):
        parser.add_argument(
            "--repository-name",
            required=True,
            type=str,
            help="The target repository",
        )
        parser.add_argument(
            "--github-access-token",
            type=str,
            required=True,
            help="The access token to call GitHub API",
        )
        parser.add_argument(
            "--sonar-cloud-access-token",
            type=str,
            required=True,
            help="The access token to call GitHub API",
        )
        parser.add_argument(
            "--installation-id",
            type=int,
            required=True,
            help="The installation ID of the SonarCloud App in your organization",
        )

    def handle(self, *args, **options):
        self.repository_name = options["repository_name"]
        self.github_access_token = options["github_access_token"]
        self.sonar_cloud_access_token = options["sonar_cloud_access_token"]
        self.installation_id = options["installation_id"]

        self.stdout.write(f"Retrieving repository ID given the parameter: {self.repository_name}")
        # PAT required scopes: repo, write:org, read:org
        github_api = Github(self.github_access_token)
        repository = github_api.get_repo(self.repository_name)
        repository_id = repository.id

        # This is not available in GitHub Python Library
        self.stdout.write(f"Adding the repository {self.repository_name} to installation ID {self.installation_id}")
        headers = {"Authorization": f"token {self.github_access_token}", "Accept": "application/vnd.github.v3+json"}
        url = f"https://api.github.com/user/installations/{self.installation_id}/repositories/{repository_id}"
        result = requests.put(url, headers=headers)

        status_code = result.status_code
        if status_code not in [204, 304]:
            error_message = result.json()["message"]
            raise CommandError(f"Something went wrong! Message given status code {status_code}: {error_message}")
        self.stdout.write("It's okay on Github!")

        organization_key = repository.organization.login
        repository_name = repository.name
        project_key = f"{organization_key}_{repository_name}"
        self.stdout.write(f"Adding project {project_key} on SonarCloud")
        sonar = SonarCloudClient("https://sonarcloud.io/", token=self.sonar_cloud_access_token)
        try:
            sonar.projects.create_project(
                project=project_key,
                name=repository_name,
                organization=organization_key,
            )
        except ValidationError as e:
            treatable_error = "could not create project, key already exists"
            if treatable_error not in str(e).lower():
                raise e
            else:
                self.stdout.write(f"Project {project_key} already exists on Sonar Cloud")
        self.stdout.write("Done!")
```

Look at the `add_arguments` method. We can define in it the command arguments, specifying their types, helps, and whether they're required. For example, if you call the command with no arguments, we'll receive the following error:

```shell
▶ python manage.py add_repository_sonar_cloud
usage: manage.py add_repository_sonar_cloud [-h] --repository-name REPOSITORY_NAME --github-access-token GITHUB_ACCESS_TOKEN --sonar-cloud-access-token
                                            SONAR_CLOUD_ACCESS_TOKEN --installation-id INSTALLATION_ID [--version] [-v {0,1,2,3}] [--settings SETTINGS]
                                            [--pythonpath PYTHONPATH] [--traceback] [--no-color] [--force-color] [--skip-checks]
manage.py add_repository_sonar_cloud: error: the following arguments are required: --repository-name, --github-access-token, --sonar-cloud-access-token, --installation-id
```

You can test it also through Python:

```python
import pytest

from django.core.management import CommandError
from django.core.management import call_command


class TestAddRepositorySonarCloud:
    def test_should_raise_error_given_missing_arguments(self):
        with pytest.raises(CommandError) as error:
            # Act
            call_command("add_repository_sonar_cloud")
        # Assert
        expected_message = "Error: the following arguments are required: --repository-name, --github-access-token, --sonar-cloud-access-token, --installation-id"
        assert str(error.value) == expected_message
```

## Using the recipe repository on Rundeck

Let's utilize the [Rundeck playground environment](https://www.willianantunes.com/blog/2022/05/rundeck-playground-environment-on-kubernetes/) to use `kind` to load the recipe image! [Download the project](https://github.com/willianantunes/tutorials/tree/master/2022/06/rundeck-recipe-repository), then, in its root folder, execute the command:

```shell
docker build -t rundeck-recipe-repository .
```

Load it into our local Kubernetes cluster through kind:

```shell
kind load docker-image rundeck-recipe-repository:latest
```

Import [this job definition](https://github.com/willianantunes/tutorials/blob/7ed4f3e42607cbd226cb1173dff3adfe258803b3/2022/06/rundeck-recipe-repository/rundeck_sample_definition_create_project_on_sonarcloud.yaml) on Rundeck and update the variables according to your environment. A sample activity displaying success (I deleted the tokens, so nothing to be worried about):

![It shows the activity result from "create project on SonarCloud" task. It states that the job has been executed successfully.](/assets/posts/blog-26-order-1-image-1-rundeck-job-execution-result.png "Rundeck activity status.")

The repository is added to the repositories list in the SonarCloud application:

![It shows which repositories the SonarCloud Application has access to.](/assets/posts/blog-26-order-1-image-2-repositories-list.png "Repository access.")

The project is created on the SonarCloud side:

![The list of all projects we have on SonarCloud. It shows only one named "test-1", which is the one we created during the test.](/assets/posts/blog-26-order-1-image-3-sonar-cloud-project.png "The project created on SonarCloud.")

## Conclusion

The approach we saw here is exciting and seems promising for micro, small, and medium-sized companies. The command to add a project on SonarCloud is just to touch a real scenario, but know this: maybe a better solution would be the adoption of [Backstage](https://github.com/backstage/backstage). This solution can make good use of Rundeck through its [webhooks](https://docs.rundeck.com/docs/learning/howto/using-webhooks.html).

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/06/rundeck-recipe-repository).

Posted listening to [Rebirth, Nando Fernandes e Rafael Bittencourt](https://youtu.be/4nb5iFt-Id0?t=82) 🎶.
