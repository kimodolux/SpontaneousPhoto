// pages/api/graphql.js
import { ApolloServer, gql } from 'apollo-server-micro'
import { makeExecutableSchema } from 'graphql-tools'
import { Db, MongoClient } from 'mongodb'

require('dotenv').config()

type MyContext = {
    db: Db
}

const typeDefs = gql`
  input UserInput {
    firstName: String!
    lastName: String!
    email: String!
  }
  type User {
    _id: ID! 
    firstName: String!
    lastName: String!
    email: String!
  }

  type Query {
    users: [User]!
  }
  type Mutation {
    addUser(user: UserInput): Boolean
  }
`

const resolvers = {
  Query: {
    async users(_: any, __: any, context: MyContext) {
      const cursor = await context.db.collection('users').find({})
      return cursor.toArray();
    },
  },
  Mutation: {
    async addUser(_: any, {user} :any, context: MyContext, _info :any){
        const doc = {
            id: user.id, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            email: user.email
        }
        try {
            const result = await context.db.collection('users').insertOne(doc);
        }
        catch{
            return false;
        }
        return true;
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

let db: Db

const apolloServer = new ApolloServer({
  schema,
  context: async () => {
    if (!db) {
      try {
        const dbClient = new MongoClient(
          process.env.MONGODB_URI ?? "",
          {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          }
        )

        if (!dbClient.isConnected()) await dbClient.connect()
        db = dbClient.db("spontaneous1") // database name
      } catch (e) {
        console.log('--->error while connecting with graphql context (db)', e)
      }
    }

    return { db }
  },
})

export const config = {
  api: {
    bodyParser: false,
  },
}

export default apolloServer.createHandler({ path: '/api/graphql' })