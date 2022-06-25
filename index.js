const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('./src/db/db');
const { ApolloServer, gql } = require('apollo-server-express');
const models = require('./src/db/models');
const typeDefs = require('./src/graphql/schema');
const resolvers = require('./src/graphql/resolvers');
const helmet = require('helmet');
const cors = require('cors');

const port = process.env.PORT;
const DB_HOST = process.env.DB_HOST;

const app = express();
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);
app.use(cors());

db.connect(DB_HOST);

const getUser = (token) => {
  if (token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      new Error('Session Invalid');
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization;
    const user = getUser(token);
    return { models, user };
  },
});

server
  .start()
  .then((res) => {
    server.applyMiddleware({ app, path: '/api' });
  })
  .then((res) => {
    app
      .listen({ port }, () =>
        console.log(`GraphQL Server running at http://localhost:${port}${server.graphqlPath}`),
      )
      .catch((e) => {
        console.log(e);
      });
  });
