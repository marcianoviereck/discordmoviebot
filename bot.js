const immutableJS = require('immutable');
const Discord = require('discord.io');
const logger = require('winston');
const auth = require('./auth.json');
const utils = require('./utils.js');
const fetches = require('./fetches.js');
const internalStorage = require('./internalStorage.js');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
const bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    fetches.fetchGenres();
});


bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        let args = message.substring(1).split(' ');
        logger.info(args);
        const cmd = args[0];
        const genre_arg = args.length > 1 ? args[1] : null;

        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDay()}`;
        const foundGenre = internalStorage.findByProperty('name', genre_arg);

        logger.info('found', foundGenre.get('name'));
        const genreParam = genre_arg && foundGenre ? `&with_genres=${foundGenre.get('id')}` : '';

        switch(cmd) {
            case 'randommovie':
              fetches.fetchMovie(channelID, bot, utils.withPosterPathAndNotInFuture, genreParam);
            break;
            case 'popularmovie':
              fetches.fetchMovie(channelID, bot, utils.withPosterPathAndNotInFuture, 'popularity.desc', genreParam);
            break;
            case 'unpopularmovie':
              fetches.fetchMovie(channelID, bot, utils.withPosterPathAndNotInFuture, 'popularity.asc', genreParam);
            break;
            case 'newmovie':
              fetches.fetchMovie(channelID, bot, utils.withPosterPathAndNotInFuture, `release_date.desc`, `&release_date.lte=${formattedDate}${genreParam}`);
            break;
            case 'futuremovie':
              fetches.fetchMovie(channelID, bot, utils.withPosterPathAndInFuture, `release_date.desc`, genreParam);
            break;
            case 'oldmovie':
              fetches.fetchMovie(channelID, bot, utils.withPosterPath, 'release_date.asc', genreParam);
            break;
            case 'genres':
              const genresList = internalStorage.getAll().toList();
              let genresText = '';
               genresList.forEach((genre, index) => {
                 genresText = genresText.concat(genre.get('name'));
                 if(index < genresList.count() - 1) {
                   genresText = genresText.concat(', ')
                 }
               });
              bot.sendMessage({
                  to: channelID,
                  message: `${genresText}`
              });
            break;
         }
     }
});
