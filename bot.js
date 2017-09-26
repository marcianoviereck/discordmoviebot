var request = require('ajax-request');
var immutableJS = require('immutable');
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

function doRequest(url, onSuccess) {
  request({
     url: `${url}`,
     method: 'GET',
     data: '',
   }, function(err, res, body) {
     onSuccess(body);
   });
}

function fetchImage(image, channelID) {
  doRequest(`https://image.tmdb.org/t/p/w500${image}`,
    function(body) {
      bot.sendMessage({
          to: channelID,
          message: body
      });
    });
}

function fetchRandomMovie(channelID) {
  doRequest(`https://api.themoviedb.org/4/list/1?api_key=${auth.api_key}`, function(body) {

    var bodyAsJS = immutableJS.fromJS(JSON.parse(body));
    var movies = bodyAsJS.get('results');

    var randomIndex = Math.floor((Math.random() * movies.count()));
    var movie = movies.get(randomIndex);

    var message = `Random movie: ${movie.get('title')}`;

    bot.sendMessage({
        to: channelID,
        message: message
    });
    logger.info(movie.get('poster_path'));

    bot.sendMessage({
        to: channelID,
        message: `https://image.tmdb.org/t/p/w500${movie.get('poster_path')}`
    });
  });
}

function fetchMovie(channelID, message, sorting, filterFunction) {
  doRequest(`https://api.themoviedb.org/3/discover/movie?api_key=${auth.api_key}&language=en-US&sort_by=${sorting}&include_adult=false&include_video=true&page=1`, function(body) {

    var bodyAsJS = immutableJS.fromJS(JSON.parse(body));
    var movies = filterFunction(bodyAsJS.get('results'));

    var randomIndex = Math.floor((Math.random() * movies.count()));
    var movie = movies.get(randomIndex);

    bot.sendMessage({
        to: channelID,
        message: movie ? `${message}: ${movie.get('release_date')} || ${movie.get('title')}` : 'sorry found nothing..'
    });

    if(movie) {
      logger.info(movie.get('poster_path'));

      bot.sendMessage({
          to: channelID,
          message: `https://image.tmdb.org/t/p/w500${movie.get('poster_path')}`
      });
    }
  });
}


bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});


bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            case 'randommovie':
              fetchRandomMovie(channelID);
            break;
            case 'popularmovie':
              const filterFunction = function(movies) {
                return movies.take(20).filter(movie => {
                  return movie.get('poster_path') && new Date(movie.get('release_date')).getTime() < new Date().getTime();
                });
              }
              fetchMovie(channelID, 'That shit popular', 'popularity.desc', filterFunction);
            break;
            case 'unpopularmovie':
              const filterFunction2 = function(movies) {
                return movies.take(20).filter(movie => {
                  return movie.get('poster_path') && new Date(movie.get('release_date')).getTime() < new Date().getTime();
                });
              }
              fetchMovie(channelID, 'Bottom of the barrel', 'popularity.asc', filterFunction2);
            break;
            case 'newmovie':
              const filterFunction3 = function(movies) {
                return movies.filter(movie => {
                  return movie.get('poster_path') && new Date(movie.get('release_date')).getTime() < new Date().getTime();
                }).take(20);
              }
              fetchMovie(channelID, 'Newnew', `release_date.desc`, filterFunction3);
            break;
            case 'futuremovie':
              const filterFunction4 = function(movies) {
                return movies.take(20).filter(movie => {
                  return movie.get('poster_path') && new Date(movie.get('release_date')).getTime() > new Date().getTime();
                });
              }
              fetchMovie(channelID, 'FUTUREEE', `release_date.desc`, filterFunction4);
            break;
            case 'oldmovie':
              const filterFunction5 = function(movies) {
                return movies.take(20).filter(movie => {
                  return movie.get('poster_path');
                });
              }
              fetchMovie(channelID, 'Old ass movie', 'release_date.asc', filterFunction5);
            break;
            case 'muchrevenue':
              const filterFunction6 = function(movies) {
                return movies.take(20).filter(movie => {
                  return movie.get('poster_path');
                });
              }
              fetchMovie(channelID, 'Get money', 'revenue.desc', filterFunction6);
            break;
            case 'littlerevenue':
              const filterFunction7 = function(movies) {
                return movies.take(20).filter(movie => {
                  return movie.get('poster_path');
                });
              }
              fetchMovie(channelID, 'Stay broke', 'revenue.asc', filterFunction7);
            break;
         }
     }
});
