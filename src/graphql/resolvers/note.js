const models = require('../../db/models');

module.exports = {
  author: async (note, args, { models }) => {
    return await models.User.findById(note.author);
  },
  favoriteBy: async (note, args, { models }) => {
    return await models.User.find({ _id: { $in: note.favoritedBy } });
  },
};
