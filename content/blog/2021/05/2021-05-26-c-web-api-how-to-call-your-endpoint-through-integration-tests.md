---
id: 05e6e5b0-be63-11eb-8b5a-9d2a03b4807f
title: "C# Web API: How to call your endpoint through integration tests"
date: 2021-05-26T20:43:27.538Z
cover: /assets/posts/blog-7-c-web-api-it.png
description: You have tests everywhere, but you still get an error when you try
  to run your application because of some wrong infrastructure setup. Know one
  way to fix that.
tags:
  - aspnet-core
  - csharp
  - tests
---
It's fantastic when you have all of your unit tests returning green signs everywhere. Still, when you execute your project, it raises an error because an infrastructure setup is wrong, making it impossible to run your [Web API](https://docs.microsoft.com/en-us/aspnet/core/tutorials/first-web-api?view=aspnetcore-5.0&tabs=visual-studio) properly 😑. It can be how you set up your logs, database, providers, well, many other things. One approach to fix it or minimize its impact is through integration tests. So how can you do a quick setup for that 🤔? By the way, in this blog post, we're going to consider the following technologies:

* [.NET Core 5](https://docs.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-5.0?view=aspnetcore-5.0)
* [xUnit.net](https://github.com/xunit/xunit)
* [Moq](https://github.com/moq/moq4)

## Describing the sample project

Here's the image that shows a sample flow:

![This flow has a person who calls the API, which does something and then returns the answer to the user.](/assets/posts/blog-7-image-1.png "Sample flow of execution")

It is composed of three steps:

1. The user calls the endpoint ***/api/v1/movies***.
2. The application will do fake processing.
3. A random movie is returned to the user.

To take care of this business rule, here's our controller:

```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class MoviesController : ControllerBase
{
    private readonly IFilmSpecialist _filmSpecialist;

    public MoviesController(IFilmSpecialist filmSpecialist)
    {
        _filmSpecialist = filmSpecialist;
    }

    [HttpGet]
    public Movie Get()
    {
        Log.Information("Let me ask the film specialist...");
        var movie = _filmSpecialist.SuggestSomeMovie();
        Log.Information("Suggested movie: {Movie}", movie);
        return movie;
    }
}
```

Who will be responsible for doing fake processing:

```csharp
public class FilmSpecialist : IFilmSpecialist
{
    private static readonly Movie[] Films =
    {
        new("RoboCop", "10/08/1987", new[] {"Action", "Thriller", "Science Fiction"}, "1h 42m"),
        new("The Matrix", "05/21/1999", new[] {"Action", "Science Fiction"}, "2h 16m"),
        new("Soul", "12/25/2020", new[] {"Family", "Animation", "Comedy", "Drama", "Music", "Fantasy"}, "1h 41m"),
        new("Space Jam", "12/25/1996", new[] {"Adventure", "Animation", "Comedy", "Family"}, "1h 28m"),
        new("Aladdin", "07/03/1993", new[] {"Animation", "Family", "Adventure", "Fantasy", "Romance"}, "1h 28m"),
        new("The World of Dragon Ball Z", "01/21/2000", new[] {"Action"}, "20m"),
    };

    public Movie SuggestSomeMovie()
    {
        Log.Debug("OKAY! Which film will I suggest 🤔");
        Random random = new();
        var filmIndexThatIWillSuggest = random.Next(0, Films.Length);
        Log.Information("Will suggest the film with index {FilmIndex}!", filmIndexThatIWillSuggest);

        return Films[filmIndexThatIWillSuggest];
    }
}
```

Let's first do the unit testing to ensure that our methods contracts are being respected.

## Starting from unit testing

Here we'll do a simple unit test on the service responsible for returning a random movie. We can write something like the following, as it's not our focus:

```csharp
public class FilmSpecialistTests
{
    private readonly IFilmSpecialist _filmSpecialist = new FilmSpecialist();

    [Fact]
    public void ShouldReturnRandomMovieWhenAsked()
    {
        // Act
        var suggestedMovie = _filmSpecialist.SuggestSomeMovie();
        // Assert
        var expectedTiles = new[]
        {
            "RoboCop", "The Matrix", "Soul", "Space Jam", "Aladdin", "The World of Dragon Ball Z"
        };
        suggestedMovie.Title.Should().BeOneOf(expectedTiles);
    }
}
```

## Making an actual HTTP request to our API

To call our endpoint, we can use a [class fixture](https://xunit.net/docs/shared-context#class-fixture) with the help of [WebApplicationFactory](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.testing.webapplicationfactory-1?view=aspnetcore-5.0) (know more about it at the [section Basic tests with the default WebApplicationFactory](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-5.0#basic-tests-with-the-default-webapplicationfactory) in [Integration tests in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-5.0) guide). In our class test constructor, we can use the factory to create a ***HttpClient***, hence allowing us to do HTTP calls to our endpoint. Moreover, let's say you'd like to replace an injected service with a mock: you can do that through `ConfigureTestServices`. To illustrate a complete example:

```csharp
public class MoviesControllerITests : IClassFixture<WebApplicationFactory<Startup>>
{
    private readonly IFilmSpecialist _filmSpecialist;
    private HttpClient _httpClient;

    public MoviesControllerITests(WebApplicationFactory<Startup> factory)
    {
        _filmSpecialist = Mock.Of<IFilmSpecialist>();
        _httpClient = factory.WithWebHostBuilder(builder =>
        {
            // https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-5.0#inject-mock-services
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IFilmSpecialist>();
                services.TryAddTransient(_ => _filmSpecialist);
            });
        }).CreateClient();
    }

    [Fact]
    public async Task ShouldCreateGameGivenFirstMovementIsBeingExecuted()
    {
        // Arrange
        var requestPath = "/api/v1/movies";
        var movieToBeSuggested = new Movie("Schindler's List", "12/31/1993", new[] {"Drama", "History", "War"}, "3h 15m");
        Mock.Get(_filmSpecialist)
            .Setup(f => f.SuggestSomeMovie())
            .Returns(movieToBeSuggested)
            .Verifiable();
        // Act
        var response = await _httpClient.GetAsync(requestPath);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var movie = await response.Content.ReadFromJsonAsync<Movie>();
        // Assert
        movie.Should().BeEquivalentTo(movieToBeSuggested);
        Mock.Get(_filmSpecialist).Verify();
    }
}
```

By the way, to use `WebApplicationFactory`, you must install the package:

```
Microsoft.AspNetCore.Mvc.Testing
```

It's pretty simple 🤗. I'll leave it as it is, but we could abstract our integration test to avoid creating a ***HttpClient*** every time for each of our class tests 😏.

## To end things off

I think you can get enormous benefits from doing a cheap integration test sometimes because, as I told you at the beginning, it can almost guarantee that your code will be shipped as expected at the infrastructure layer. In this article, I gave a somewhat simple example, but things can be more challenging, let's say when it comes to broker connection — the subject of another blog entry 😜.

You can consult the code I showed here on [this GitHub repository](https://github.com/willianantunes/tutorials/tree/master/2021/05/c-sharp-web-api-how-to-endpoint-it). You can use Docker Compose to [run the project](https://github.com/willianantunes/tutorials/blob/332bdcee8385ceb27cecd7c95a1ec6dadfc4cfe4/2021/05/c-sharp-web-api-how-to-endpoint-it/docker-compose.yaml#L7) as well as [execute its tests](https://github.com/willianantunes/tutorials/blob/332bdcee8385ceb27cecd7c95a1ec6dadfc4cfe4/2021/05/c-sharp-web-api-how-to-endpoint-it/docker-compose.yaml#L19). Check the [README](https://github.com/willianantunes/tutorials/blob/master/2021/05/c-sharp-web-api-how-to-endpoint-it/README.md) for more details.

Posted listening to [Toy Soldiers, Martika](https://www.youtube.com/watch?v=LvdLovAaYzM).