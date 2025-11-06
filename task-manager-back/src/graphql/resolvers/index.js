import { GraphQLDateTime } from 'graphql-scalars';
import { userResolvers } from './user.js';
import { projectResolvers } from './project.js';
import { taskResolvers } from './task.js';
import { labelResolvers } from './label.js';
import { commentResolvers } from './comment.js';

export const resolvers = {
  DateTime: GraphQLDateTime,
  
  Query: {
    ...userResolvers.Query,
    ...projectResolvers.Query,
    ...taskResolvers.Query,
    ...labelResolvers.Query,
    ...commentResolvers.Query,
  },
  
  Mutation: {
    ...userResolvers.Mutation,
    ...projectResolvers.Mutation,
    ...taskResolvers.Mutation,
    ...labelResolvers.Mutation,
    ...commentResolvers.Mutation,
  },
  
  ...userResolvers.types,
  ...projectResolvers.types,
  ...taskResolvers.types,
  ...labelResolvers.types,
  ...commentResolvers.types,
};