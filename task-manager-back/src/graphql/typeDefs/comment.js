export const commentTypeDefs = `#graphql
  type Comment {
    id: ID!
    task: Task!
    user: User!
    content: String!
    created_at: DateTime!
    updated_at: DateTime!
  }

  extend type Query {
    comments(taskId: ID!): [Comment]
    comment(id: ID!): Comment
  }

  extend type Mutation {
    createComment(
      taskId: ID!
      content: String!
    ): Comment
    
    updateComment(
      id: ID!
      content: String!
    ): Comment
    
    deleteComment(id: ID!): Boolean
  }
`;