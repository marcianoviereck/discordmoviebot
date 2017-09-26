var request = require('ajax-request');
var immutableJS = require('immutable');
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var utils = require('./utils.js');

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

function fetchMovie(channelID, message, filterFunction, sorting, extraParams) {
  let params = '';
  if (sorting) {
    params = params.concat(`&sort_by=${sorting}`);
  }

  if (extraParams) {
    params = params.concat(extraParams);
  }

  logger.info(params);
  doRequest(`https://api.themoviedb.org/3/discover/movie?api_key=${auth.api_key}&language=en-US${params}&include_adult=false&include_video=true&page=1`, function(body) {

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
              fetchMovie(channelID, 'That shit popular', utils.withPosterPathAndNotInFuture, 'popularity.desc');
            break;
            case 'unpopularmovie':
              fetchMovie(channelID, 'Bottom of the barrel', utils.withPosterPathAndNotInFuture, 'popularity.asc');
            break;
            case 'newmovie':
              const now = new Date();
              const formattedDate = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDay()}`;
              logger.info(formattedDate);
              fetchMovie(channelID, 'Newnew', utils.withPosterPathAndNotInFuture, `release_date.desc`, `&release_date.lte=${formattedDate}`);
            break;
            case 'futuremovie':
              fetchMovie(channelID, 'FUTUREEE', utils.withPosterPathAndInFuture, `release_date.desc`);
            break;
            case 'oldmovie':
              fetchMovie(channelID, 'Old ass movie', utils.withPosterPath, 'release_date.asc');
            break;
            case 'muchrevenue':
              fetchMovie(channelID, 'Get money', utils.withPosterPath, 'revenue.desc');
            break;
            case 'littlerevenue':
              fetchMovie(channelID, 'Stay broke', utils.withPosterPath, 'revenue.asc');
            break;
         }
     }
});
