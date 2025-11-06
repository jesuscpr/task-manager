import { userTypeDefs } from './user.js';
import { projectTypeDefs } from './project.js';
import { taskTypeDefs } from './task.js';
import { labelTypeDefs } from './label.js';
import { commentTypeDefs } from './comment.js';

const baseTypeDefs = `#graphql
  scalar DateTime
  
  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [
  baseTypeDefs,
  userTypeDefs,
  projectTypeDefs,
  taskTypeDefs,
  labelTypeDefs,
  commentTypeDefs,
];