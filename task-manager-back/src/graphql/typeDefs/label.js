export const labelTypeDefs = `#graphql
  enum LabelScope {
    GLOBAL
    PROJECT
    USER
  }

  type Label {
    id: ID!
    name: String!
    color: String!
    scope: LabelScope!
    creator: User
    project: Project
    created_at: DateTime!
  }

  extend type Query {
    labels(
      projectId: ID
      scope: LabelScope
    ): [Label]
    
    label(id: ID!): Label
    
    myFavoriteLabels: [Label]
  }

  extend type Mutation {
    createLabel(
      name: String!
      color: String!
      scope: LabelScope!
      projectId: ID
    ): Label
    
    updateLabel(
      id: ID!
      name: String
      color: String
    ): Label
    
    deleteLabel(id: ID!): Boolean
    
    addLabelToTask(
      taskId: ID!
      labelId: ID!
    ): Task
    
    removeLabelFromTask(
      taskId: ID!
      labelId: ID!
    ): Task
    
    addFavoriteLabel(labelId: ID!): Boolean
    
    removeFavoriteLabel(labelId: ID!): Boolean
  }
`;