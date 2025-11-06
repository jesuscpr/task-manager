export const taskTypeDefs = `#graphql
  enum TaskStatus {
    TODO
    IN_PROGRESS
    DONE
  }

  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  type Task {
    id: ID!
    project: Project!
    project_id: ID!
    title: String!
    description: String
    status: TaskStatus!
    priority: TaskPriority!
    creator: User
    assigned_to: [User]
    labels: [Label]
    comments: [Comment]
    due_date: DateTime
    position: Int!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type TaskAssignment {
    id: ID!
    task: Task!
    user: User!
    assigned_at: DateTime!
  }

  input TaskFilterInput {
    status: TaskStatus
    priority: TaskPriority
    assigned_to_me: Boolean
    created_by_me: Boolean
    has_label: ID
  }

  extend type Query {
    tasks(
      projectId: ID!
      filter: TaskFilterInput
    ): [Task]
    
    task(id: ID!): Task
    
    myTasks(
      status: TaskStatus
      priority: TaskPriority
    ): [Task]
  }

  extend type Mutation {
    createTask(
      projectId: ID!
      title: String!
      description: String
      status: TaskStatus
      priority: TaskPriority
      due_date: DateTime
      position: Int
    ): Task
    
    updateTask(
      id: ID!
      title: String
      description: String
      status: TaskStatus
      priority: TaskPriority
      due_date: DateTime
      position: Int
    ): Task
    
    deleteTask(id: ID!): Boolean
    
    assignTask(
      taskId: ID!
      userId: ID!
    ): TaskAssignment
    
    unassignTask(
      taskId: ID!
      userId: ID!
    ): Boolean
    
    reorderTasks(
      projectId: ID!
      taskIds: [ID!]!
    ): [Task]
  }
`;