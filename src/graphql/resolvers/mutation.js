const models = require('../../db/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AuthenticationError, ForbiddenError } = require('apollo-server-express');
require('dotenv').config();
const gravatar = require('../../util/gravatar');
const mongoose = require('mongoose');

module.exports = {
  newNote: async (parent, args, { user }) => {
    if (!user) {
      throw new AuthenticationError('You must be signed in to create a note');
    }

    return models.Note.create({
      content: args.content,
      author: mongoose.Types.ObjectId(user.id),
    });
  },
  updateNote: async (parent, args, { user }) => {
    const note = await models.Note.findById(args.id);

    if (!user) {
      throw AuthenticationError('You must be signed in to update the note');
    }

    if (note && String(note.author) !== user.id) {
      throw ForbiddenError("You don't have permissions to update the note");
    }

    return models.Note.findByIdAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: {
          content: args.content,
        },
      },
      { new: true },
    );
  },
  deleteNote: async (parent, { id }, { models, user }) => {
    const note = await models.Note.findById(id);

    if (!user) {
      throw new AuthenticationError('You must be signed in to delete a note');
    }

    if (note && String(note.author) !== user.id) {
      throw ForbiddenError("You don't have permissions to delete the note");
    }

    try {
      await models.Note.findOneAndRemove({ _id: id });
      return true;
    } catch (error) {
      return false;
    }
  },

  signUp: async (parent, { username, email, password }) => {
    email = email.toLowerCase().trim();
    const hashed = await bcrypt.hash(password, 10);
    const avatar = gravatar(email);
    try {
      const user = await models.User.create({
        email,
        username,
        avatar,
        password: hashed,
      });
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error(error);
    }
  },
  signIn: async (parent, { username, email, password }) => {
    if (email) {
      email = email.toLowerCase().trim();
    }

    const user = await models.User.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      throw new AuthenticationError('Error signing in');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new AuthenticationError('Error signing in');
    }

    return jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  },

  toggleFavorite: async (parent, { id }, { user }) => {
    if (!user) {
      throw AuthenticationError('You must be signed in to favorite a note');
    }
    let noteCheck = await models.Note.findById(id);
    const hasUser = noteCheck.favoriteBy.indexOf(user.id);

    if (hasUser >= 0) {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $pull: {
            favoriteBy: mongoose.Types.ObjectId(user.id),
          },
          $inc: {
            favoriteCount: -1,
          },
        },
        {
          new: true,
        },
      );
    } else {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $push: {
            favoriteBy: mongoose.Types.ObjectId(user.id),
          },
          $inc: {
            favoriteCount: 1,
          },
        },
        {
          new: true,
        },
      );
    }
  },
};
