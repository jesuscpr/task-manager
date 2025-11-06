export const userTypeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    username: String
    full_name: String
    avatar_url: String
    bio: String
    created_at: DateTime!
    updated_at: DateTime!
  }

  type AuthPayload {
    user: User!
    access_token: String
    refresh_token: String
    email_confirmation_required: Boolean
  }

  extend type Query {
    me: User
    user(id: ID!): User
    searchUsers(query: String!): [User]
  }

  extend type Mutation {
    signUp(
      email: String!
      password: String!
      username: String
      full_name: String
    ): AuthPayload
    
    signIn(
      email: String!
      password: String!
    ): AuthPayload
    
    signOut: Boolean
    
    updateProfile(
      username: String
      full_name: String
      avatar_url: String
      bio: String
    ): User
  }
`;