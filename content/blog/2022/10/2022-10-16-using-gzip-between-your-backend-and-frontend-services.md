---
id: f969b370-4da5-11ed-8a1b-8767fff78b52
title: Using GZIP between your backend and frontend services
date: 2022-10-16T22:57:56.831Z
cover: /assets/posts/blog-30-using-gzip-between-your-backend-and-frontend-services.png
description: Seeking client-side examples that use GZIP? Wanting to know how to
  use it with one particular query string? Then, click on me and learn more!
tags:
  - javascript
  - csharp
  - datacompression
  - gzip
---
Have you ever faced a constraint of data limitation between your client and server applications? For example, recently, I've got an error of a URI size limit of 8892 bytes, which allows something close to 9000 characters on the URI path. Unfortunately, my team couldn't change the origin to respect the constraint because of how the ecosystem works. A change like this would demand considerable effort, increasing the time to deliver the solution. Fortunately, we found a quick solution by using [GZIP](https://en.wikipedia.org/wiki/Gzip)!

## A sample project showing GZIP in action

We had to compress the data on the backend and send it to the frontend, where it would decompress it. So, after a bit of research, these are the steps we followed to implement it in the project:

* C# backend:

  * Use the namespace [`System.IO.Compression`](https://learn.microsoft.com/en-us/dotnet/api/system.io.compression?view=net-6.0) that provides a native solution (without external libraries) to handle GZIP requirements.
  * Convert the gzipped content to base64 to ensure the data remains intact without modifications during transport. In our case, through the HTTP header.
* JavaScript frontend:

  * Use the [Pako](https://github.com/nodeca/pako/) library to inflate the data received from the backend. The [Compression Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API) is a native API available on browsers but not very well supported.

To see it in action, download [this project](https://github.com/willianantunes/tutorials/tree/master/2022/10/gzip-between-backend-frontend-sample) and execute the following  command:

```text
▶ docker-compose up app
Starting gzip-between-backend-frontend-sample_app_1 ... done
Attaching to gzip-between-backend-frontend-sample_app_1
app_1        | ### Running and watching the project 👀
app_1        | dotnet watch ⌚ Polling file watcher is enabled
app_1        | dotnet watch 🚀 Started
app_1        | Building...
app_1        | warn: Microsoft.AspNetCore.DataProtection.Repositories.FileSystemXmlRepository[60]
app_1        |       Storing keys in a directory '/root/.aspnet/DataProtection-Keys' that may not be persisted outside of the container. Protected data will be unavailable when container is destroyed.
app_1        | info: Microsoft.Hosting.Lifetime[14]
app_1        |       Now listening on: http://0.0.0.0:5128
app_1        | dotnet watch 🌐 Unable to launch the browser. Navigate to http://0.0.0.0:5128
app_1        | info: Microsoft.Hosting.Lifetime[0]
app_1        |       Application started. Press Ctrl+C to shut down.
app_1        | info: Microsoft.Hosting.Lifetime[0]
app_1        |       Hosting environment: Development
app_1        | info: Microsoft.Hosting.Lifetime[0]
app_1        |       Content root path: /app/src/
```

If you access `http://localhost:5128/` and submit the text `Type something and check its output as GZip!` but written ten times, you'll get the following:

![You'll see three text boxes. The first one shows the compressed text as base64. The second shows the compressed text. The third and last one shows the raw text you typed at the beginning of the flow.](/assets/posts/blog-30-order-1-image-1-sample-project.png "Landing page")

Notice the compressed data has 90 bytes while the original has 449 bytes. So the algorithm reduced the original data by almost 80% 😲.

### Flow details

If you are in doubt about where you go in the code when you test the project, look at the bullets:

* When you access `http://localhost:5128/`, the `HomeController` handles it through the [`Index` method](https://github.com/willianantunes/tutorials/blob/5ffc66a1b3cb159c717839db5231c707c80ef6b3/2022/10/gzip-between-backend-frontend-sample/src/Controllers/HomeController.cs#L15-L18). 
* Including other `cshtml` files, the [`Index.cshtml`](https://github.com/willianantunes/tutorials/blob/5ffc66a1b3cb159c717839db5231c707c80ef6b3/2022/10/gzip-between-backend-frontend-sample/src/Views/Home/Index.cshtml) is SSR (server-side rendering), and an HTML is sent to the browser.
* When you submit a text, [the form](https://github.com/willianantunes/tutorials/blob/5ffc66a1b3cb159c717839db5231c707c80ef6b3/2022/10/gzip-between-backend-frontend-sample/src/Views/Home/Index.cshtml#L10) sends the GET request to the method [`RetrieveGZippedContent`](https://github.com/willianantunes/tutorials/blob/5ffc66a1b3cb159c717839db5231c707c80ef6b3/2022/10/gzip-between-backend-frontend-sample/src/Controllers/HomeController.cs#L20-L27) in the `HomeController`.
* The method `RetrieveGZippedContent` gets the text, compresses it, and then sends it as a query string using a redirect (302) to the `Index`. Check out [its test](https://github.com/willianantunes/tutorials/blob/5ffc66a1b3cb159c717839db5231c707c80ef6b3/2022/10/gzip-between-backend-frontend-sample/tests/Helpers/GZipNegotiatorTests.cs#L11-L30)!
* When the JavaScript on the browser [notices the query string](https://github.com/willianantunes/tutorials/blob/5ffc66a1b3cb159c717839db5231c707c80ef6b3/2022/10/gzip-between-backend-frontend-sample/src/Views/Home/Index.cshtml#L55-L66), it gets the compressed text as base 64 and retrieves its original value through the method [`retrieveInflatedFromDeflateAsBase64`](https://github.com/willianantunes/tutorials/blob/5ffc66a1b3cb159c717839db5231c707c80ef6b3/2022/10/gzip-between-backend-frontend-sample/src/Views/Home/Index.cshtml#L38-L50).
* Ultimately, the script configures the fields and displays the [hidden HTML](https://github.com/willianantunes/tutorials/blob/5ffc66a1b3cb159c717839db5231c707c80ef6b3/2022/10/gzip-between-backend-frontend-sample/src/Views/Home/Index.cshtml#L19).

### Limitations

You'll get the error [414](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414#:~:text=The%20HTTP%20414%20URI%20Too,server%20is%20willing%20to%20interpret.) (URI too long) if you put a huge input. To avoid that, you can change the project by sending the text through the body.

## Conclusion

Although we could solve the issue, this is absolutely a technical debt. Sometimes a technical debt is acceptable as long as there is a path toward something that fixes not only it but many other aspects of the project or the ecosystem. The thing is: Is this a technical debt that we tell we'll fix in the future, but it never happens, or is it one that indeed will be fixed? I hope for the latter 🙏.

[See everything we did here on GitHub](https://github.com/willianantunes/tutorials/tree/master/2022/10/gzip-between-backend-frontend-sample).

Posted listening to [The Crying Game, Boy George](https://youtu.be/-EPGhjxm0G0) 🎶.
