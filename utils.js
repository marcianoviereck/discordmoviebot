const LIMIT = 40;

exports.withPosterPath = function(movies) {
  return movies.filter(movie => {
    return movie.get('poster_path');
  }).take(LIMIT);
}

exports.withPosterPathAndInFuture = function(movies) {
  return movies.filter(movie => {
    return movie.get('poster_path') && new Date(movie.get('release_date')).getTime() > new Date().getTime();
  }).take(LIMIT);
}

exports.withPosterPathAndNotInFuture = function(movies) {
  return movies.filter(movie => {
    return movie.get('poster_path') && new Date(movie.get('release_date')).getTime() < new Date().getTime();
  }).take(LIMIT);
}
