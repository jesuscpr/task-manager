export const projectTypeDefs = `#graphql
  enum ProjectRole {
    ADMIN
    MEMBER
    VIEWER
  }

  type Project {
    id: ID!
    name: String!
    description: String
    owner: User!
    owner_id: ID!
    is_archived: Boolean!
    members: [ProjectMember]
    tasks: [Task]
    created_at: DateTime!
    updated_at: DateTime!
  }

  type ProjectMember {
    id: ID!
    project: Project!
    user: User!
    role: ProjectRole!
    joined_at: DateTime!
  }

  extend type Query {
    projects(includeArchived: Boolean): [Project]
    project(id: ID!): Project
    projectMembers(projectId: ID!): [ProjectMember]
  }

  extend type Mutation {
    createProject(
      name: String!
      description: String
    ): Project
    
    updateProject(
      id: ID!
      name: String
      description: String
      is_archived: Boolean
    ): Project
    
    deleteProject(id: ID!): Boolean
    
    addProjectMember(
      projectId: ID!
      userId: ID!
      role: ProjectRole
    ): ProjectMember
    
    updateProjectMemberRole(
      projectId: ID!
      userId: ID!
      role: ProjectRole!
    ): ProjectMember
    
    removeProjectMember(
      projectId: ID!
      userId: ID!
    ): Boolean
  }
`;