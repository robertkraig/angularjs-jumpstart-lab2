var app = angular.module("MovieTalk", ['ngRoute', 'ngResource']);

app.config(['$routeProvider', function($routeProvider)
{
        $routeProvider.
            when('/movies', {
                templateUrl: 'home.html',
                controller: 'MovieCtrl'
            }).
            when('/movies/:movieid', {
                templateUrl: 'details.html',
                controller: 'MovieDetailsCtrl'
            }).
            otherwise({
                redirectTo: '/movies'
            });
    }
]).config(['$httpProvider', function($httpProvider)
{
    $httpProvider.defaults.headers.common['X-ZUMO-APPLICATION'] = 'cgGFClBIplHSeUBuWhDEREISndVknm23'; // add the application key
    $httpProvider.defaults.headers.common['Content-Type'] = 'application/json';
}]);

app.controller("MovieCtrl", function($scope, $http, Session)
{
    var url = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json?apikey=kmr2h7zmza5mtpkwsdhraae7&callback=JSON_CALLBACK';

    $scope.message = "Hello from controller";
    $scope.search = function(term)
    {
        if(typeof term != 'undefined')
        {
            url = 'http://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey=kmr2h7zmza5mtpkwsdhraae7&callback=JSON_CALLBACK&q=' + term;
        }

        $http.jsonp(url).success(function(json)
        {
            Session.movies = json.movies;
            $scope.movies = json.movies;
        });
    };
});


app.controller("MovieDetailsCtrl", function($scope, $routeParams, Session, Movies)
{
    var movieId = $routeParams.movieid;
    $scope.movie = _.findWhere(Session.movies, {
        id: movieId
    });

    Movies.GetReviewsByMovieId(movieId).success(function(reviews)
    {
        $scope.reviews = reviews;
    });

    $scope.saveMovie = function(movie)
    {
        var review = new Movies.Review();

        review.movieId = movie.id;
        review.body = $scope.newReviewBody;
        review.author = $scope.newReviewAuthor;
        review.$save(function()
        {
            Movies.GetReviewsByMovieId(movieId).success(function(reviews)
            {
                $scope.reviews = reviews;
            });
        });
    };

});


// shares data between code
app.factory("Session", function()
{
    return {};
});

app.factory('Movies', function($resource, $http)
{
    var resource = $resource('https://movietalk.azure-mobile.net/tables/reviews/:id',
        {
            id: '@id'
        },
        {
            'update': {
                method: 'PATCH'
            },
            'delete': {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: null
            },
            'remove': {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: null
            }
        });

    var service = {
        Review: resource,
        GetReviewsByMovieId: function(movieId)
        {
            return $http.get('https://movietalk.azure-mobile.net/tables/reviews/?$filter=(movieId eq ' + movieId + ' )');
        }
    };

    return service;
});


app.filter('minutesToTime', function()
{
    return function(input)
    {
        var hours = Math.floor(input / 60);
        var minutes = input % 60;
        return hours + ":" + minutes;
    };
})

