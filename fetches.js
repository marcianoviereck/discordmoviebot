const auth = require('./auth.json');
const request = require('ajax-request');
const immutableJS = require('immutable');
const logger = require('winston');

const internalStorage = require('./internalStorage.js');

const genresURL = function() {
  return `https://api.themoviedb.org/3/genre/movie/list?api_key=${auth.api_key}&language=en-US`;
}

const discoverURL = function(params) {
  return `https://api.themoviedb.org/3/discover/movie?api_key=${auth.api_key}&language=en-US${params}&include_adult=false&include_video=true&page=1`;
}

exports.doRequest = function(url, onSuccess) {
  request({
     url: `${url}`,
     method: 'GET',
     data: '',
   }, function(err, res, body) {
     onSuccess(body);
   });
}

exports.fetchGenres = function() {
  exports.doRequest(genresURL(), function(body) {

    const bodyAsJS = immutableJS.fromJS(JSON.parse(body));
    const genres = bodyAsJS.get('genres');
    logger.info(`fetched ${genres.count()} genres`);
    internalStorage.bulkSave(genres, 'id', 'name');
    logger.info('stored all the genres!');
  });
}

exports.fetchMovie = function(channelID, bot, filterFunction, sorting, extraParams) {
  let params = '';
  if (sorting) {
    params = params.concat(`&sort_by=${sorting}`);
  }

  if (extraParams) {
    params = params.concat(extraParams);
  }

  exports.doRequest(discoverURL(params), function(body) {

    const bodyAsJS = immutableJS.fromJS(JSON.parse(body));
    const movies = filterFunction(bodyAsJS.get('results'));

    const randomIndex = Math.floor((Math.random() * movies.count()));
    const movie = movies.get(randomIndex);

    bot.sendMessage({
        to: channelID,
        message: movie ? `${movie.get('release_date')} || ${movie.get('title')}` : 'sorry found nothing..'
    });

    if(movie) {
      bot.sendMessage({
          to: channelID,
          message: `https://image.tmdb.org/t/p/w500${movie.get('poster_path')}`
      });
    }
  });
}
