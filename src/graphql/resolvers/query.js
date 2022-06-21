const models = require('../../db/models');

module.exports = {
  notes: async () => {
    return await models.Note.find().limit(100);
  },
  note: async (parent, args) => {
    return await models.Note.findById(args.id);
  },

  user: async (parent, { username }) => {
    return await models.User.findOne(username);
  },
  users: async (parent) => {
    return await models.User.find({});
  },
  me: async (parent, args, { user }) => {
    return await models.User.findById(user.id);
  },
  noteFeed: async (parent, { cursor }) => {
    const limit = 10;
    let hasNextPage = false;
    let cursorQuery = {};

    if (cursor) {
      cursorQuery = { _id: { $lt: cursor } };
    }

    let notes = await models.Note.find(cursorQuery)
      .sort({ _id: -1 })
      .limit(limit + 1);

    if (notes.length > limit) {
      hasNextPage = true;
      notes = notes.slice(0, -1);
    }

    const newCursor = notes[notes.length - 1]._id;

    return {
      notes,
      cursor: newCursor,
      hasNextPage,
    };
  },
};
