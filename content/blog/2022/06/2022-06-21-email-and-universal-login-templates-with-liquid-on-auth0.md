---
id: 484aeee0-f154-11ec-bd24-9b1a0aa252a6
title: Email and Universal Login Templates with Liquid on Auth0
date: 2022-06-21T12:19:17.479Z
cover: /assets/posts/blog-27-email-and-universal-login-templates-with-liquid-on-auth0.png
description: Testing email templates manually will make things a lot slower. How
  about using a playground project with Sinatra and Liquid? Doubts? Come closer!
tags:
  - auth0
  - liquid
  - ruby
  - sinatra
---
One thing that annoys me is how complex a software development life cycle can be if you're coding a project that depends on the platform to test and run in some sense. You can see similar circumstances if you're building something that relies on a [Liquid template engine](https://github.com/Shopify/liquid) and [Auth0](https://auth0.com/docs/get-started/auth0-overview). It has great guides about [Customize Email Templates](https://auth0.com/docs/customize/email/email-templates) and [Customize New Universal Login Pages](https://auth0.com/docs/customize/universal-login-pages/universal-login-page-templates), but they're insufficient. That's why I'm sharing the project [Auth0 Liquid Tester](https://github.com/willianantunes/tutorials/tree/master/2022/06/auth0-liquid-tester) so you can save time when creating your custom template 🚀.

## How it works

You can issue the following command:

```shell
docker-compose up
```

Then you can check all the templates at `http://localhost:9292/`. Because of [this volume](https://github.com/willianantunes/tutorials/blob/092ca24e059a29f2af3cdcd94191542623e04808/2022/06/auth0-liquid-tester/docker-compose.yaml#L11-L12), if you update any template in the [views folder](https://github.com/willianantunes/tutorials/tree/092ca24e059a29f2af3cdcd94191542623e04808/2022/06/auth0-liquid-tester/views), it will reflect immediately after a refresh in the browser. You can also test more complicated scenarios by changing what Liquid receives through the controllers:

* [email_controller.rb](https://github.com/willianantunes/tutorials/blob/092ca24e059a29f2af3cdcd94191542623e04808/2022/06/auth0-liquid-tester/lib/email_controller.rb)
* [new_universal_login_controller.rb](https://github.com/willianantunes/tutorials/blob/092ca24e059a29f2af3cdcd94191542623e04808/2022/06/auth0-liquid-tester/lib/new_universal_login_controller.rb)

All email templates come with some configuration about i18n. Look at this example from [`welcome_email.liquid`](https://github.com/willianantunes/tutorials/blob/092ca24e059a29f2af3cdcd94191542623e04808/2022/06/auth0-liquid-tester/views/welcome_email.liquid):

```django
{% assign language = user.user_metadata.preferredLanguage %}
{% if language %}
  {% assign language = user.user_metadata.preferredLanguage | slice: 0,2 %}
{% endif%}
{% assign company_name = "Rave of Phonetics" %}
{% capture company_image %}
  <img alt="Rave of Phonetics" height="auto" src="https://avatars.githubusercontent.com/u/83559025?s=200&v=4" style="border: 0; display: block; outline: none; text-decoration: none; height: auto; width: 100%; font-size: 13px" width="150" />
{% endcapture %}
{% if language == 'pt' %}
  {% capture action_image %}
    <img alt="Símbolo que representa verificação" height="auto" src="http://cdn.auth0.com/website/emails/product/top-verify.png" style="border: 0; display: block; outline: none; text-decoration: none; height: auto; width: 100%; font-size: 13px" width="80" />
  {% endcapture %}
  {% capture highlighted_title %}
    Cadastro validado.<br /> Seja bem-vindo!
  {% endcapture %}
  {% capture bottom_text %}
    Você recebeu este e-mail porque você tem uma conta no {{ company_name }}. Se você não sabe o porquê está recebendo esta mensagem, por favor entre em <a href="{{ support_url }}" style="color: #0a84ae; text-decoration: none">contato conosco</a>.
  {% endcapture %}
{% else %}
  {% capture action_image %}
    <img alt="Symbol that represents verify" height="auto" src="http://cdn.auth0.com/website/emails/product/top-verify.png" style="border: 0; display: block; outline: none; text-decoration: none; height: auto; width: 100%; font-size: 13px" width="80" />
  {% endcapture %}
  {% capture highlighted_title %}
    Your account has been verified.<br /> Seja bem-vindo!
  {% endcapture %}
  {% assign highlighted_title = "You have been verified. Welcome!" %}
  {% capture bottom_text %}
    You’re receiving this email because you have an account in {{ company_name }}. If you are not sure why you’re receiving this, please contact us through our <a href="{{ support_url }}" style="color: #0a84ae; text-decoration: none">Support Center</a>.
  {% endcapture %}
{% endif %}
```

The project also includes [basic tests](https://github.com/willianantunes/tutorials/tree/092ca24e059a29f2af3cdcd94191542623e04808/2022/06/auth0-liquid-tester/spec). In theory, you can create a test for each email template to guarantee that Liquid can render it correctly, including any required param that must be present, like `{{ code }}` or `{{ url }}`. Check out [this sample](https://github.com/willianantunes/tutorials/blob/092ca24e059a29f2af3cdcd94191542623e04808/2022/06/auth0-liquid-tester/spec/email_controller_spec.rb#L4-L20) about the *verification email with the link*:

```ruby
RSpec.describe(EmailController) do
  context "verification email link" do
    it 'should render properly' do
      get '/verification-email-link'

      expected_values = [
        "jafar@willianantunes.com",
        "https://www.willianantunes.com/",
        "https://github.com/willianantunes/tutorials"
      ]

      expect(last_response.status).to(be(200))

      expected_values.each do |name|
        expect(last_response.body).to(include(name))
      end
    end
  end
end  
```

## Email templates available

Here's a list of what is available and a brief description of each one followed by its image. I took the definitions from Auth0 😁.

### Verification Email (using Link)

This email will be sent whenever a user signs up or logs in for the first time.

![It's a template email about the process of verifying the email using a link.](/assets/posts/blog-26-order-1-image-1-verification-email-link.png "Verification email (using link).")

### Verification Email (using Code)

This email will be sent in scenarios where the user needs to prove they have access to the email on file for an account: 

1. You have enabled the code-based email verification flow, and a user signs up or logs into the account for the first time. 
2. You have enabled the Adaptive MFA policy, and there is a low-confidence transaction for which account ownership must be verified.

![It's a template email about the process of verifying the email using a code. This code is provided in the application.](/assets/posts/blog-27-order-2-image-2-verification-email-code.png "Verification email (using code).")

### Welcome Email

This email will be sent once the user verifies their email address. If the Verification Email is turned off, it will be sent when the user signs up or logs in for the first time.

![It's a template email about a welcome message after the user's verification.](/assets/posts/blog-27-order-3-image-3-welcome-email.png "Welcome email.")

### Enroll in Multifactor Authentication

This email will be sent when an admin sends a guardian enrollment email.

![The template email has a link where the user goes to a site to enroll in multi-factor authentication.](/assets/posts/blog-27-order-4-image-4-enroll-in-mfa.png "Guardian enrollment email.")

### Change Password

This email will be sent whenever a user requests a password change. The password will not be changed until the user follows the verification link in the email.

![The template email has a link where the user configures his new password.](/assets/posts/blog-27-order-5-image-5-change-password.png "Change password email.")

### Blocked Account Email

This email will be sent whenever a user is blocked due to suspicious login attempts.

![The template email informs the user that the identity provider has detected suspicious activity in his account. Then, the user can unblock his account by clicking on a button.](/assets/posts/blog-27-order-6-image-6-blocked-account.png "Blocked account email.")

### Password Breach Alert

This email will be sent whenever Auth0 detects that the user is trying to access the application using a password that a third party has leaked.

![The template email informs the user that his account has been compromised. He won't be able to log in again until he changes his password.](/assets/posts/blog-27-order-7-image-7-password-breach-alert.png "Password breach alert email.")

### Verification Code for Email MFA

Will provide the MFA verification code to a user using an MFA email verifier.

![The template email informs a code that the user can use to complete an MFA step.](/assets/posts/blog-27-order-8-image-8-verification-code-mfa.png "Verification code for email MFA.")

### User Invitation

This email will be sent whenever a user is invited to an organization or application.

![The template email has an invitation link, including other details, where the user is authorized to join the organization.](/assets/posts/blog-27-order-9-image-9-user-invitation.png "User invitation email.")

### Passwordless Email

Will provide a code that the user can use to log in.

![The template email provides a code that the user can use to authenticate himself. This is known as a one-time password.](/assets/posts/blog-27-order-10-image-10-passwordless-email.png "Passwordless email.")

## New Universal Login templates available

Again I took the templates from Auth0, excluding the one with a modal for terms of use. You can implement the terms of use with [Redirect with Actions](https://github.com/willianantunes/tutorials/tree/master/2022/07/django-redirect-with-actions), but it's a lot more complicated as it requires an external service. All explained, let's see the templates.

### Basic

The most straightforward template. It shows what happens if you just use the widget without anything else.

![It shows a login box on the upper left of the page. It has nothing apart from that.](/assets/posts/blog-27-order-11-image-11-nul-basic.png "Basic New Universal Login.")

### Login box + image

The following template will show the login box to the left and an image to the right only for the login/signup pages. The rest of the pages will look like the default ones. [Use the query string](https://github.com/willianantunes/tutorials/blob/092ca24e059a29f2af3cdcd94191542623e04808/2022/06/auth0-liquid-tester/lib/new_universal_login_controller.rb#L9-L10) to change how it behaves.

![There are two panels: One panel has the login box, and the other has an image.](/assets/posts/blog-27-order-12-image-12-nul-box-image.png "New Universal Login inside a box with an image.")

### Page footers

The template adds a gray footer with links to Privacy Policy and Terms of Services.

![The login box is centered on the screen. You also have the footer informing the terms of use and the privacy policy.](/assets/posts/blog-27-order-13-image-13-nul-footers.png "New Universal Login with custom background and footer.")

### Terms of use acceptance

This would happen only during the sign-up flow. The user would have to accept before going on.

![It has a modal informing the user about the terms of use and the privacy policy. To proceed, the user must accept the terms.](/assets/posts/blog-27-order-14-image-14-nul-terms-of-use.png "New Universal Login with a modal asking to accept the terms of use.")

## Conclusion

At first glance, Auth0 seems to have all the sample projects you need to create yours, but that's partly correct. Most sample projects are not production-ready, which is understandable from a certain point of view. Nevertheless, Auth0 offers a great development experience, and I can assure you it's on a whole different level when you compare it with its competitors. Excellent docs, various sample projects, great articles, easy integration process, [diversity of libraries and SDKs](https://auth0.com/docs/libraries), and many more. However, it's not flawless, and that's totally fine 🙂.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/06/auth0-liquid-tester).

Posted listening to [Made of Tears, Joe Satriani](https://youtu.be/M4lsB-B1O7U) 🎶.