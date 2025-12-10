import { gql } from '@apollo/client'

// =====================================================
// AUTH MUTATIONS
// =====================================================
export const SIGN_UP = gql`
  mutation SignUp($email: String!, $password: String!, $username: String, $full_name: String) {
    signUp(email: $email, password: $password, username: $username, full_name: $full_name) {
      user {
        id
        email
        username
        full_name
      }
      access_token
      refresh_token
    }
  }
`

export const SIGN_IN = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      user {
        id
        email
        username
      }
      access_token
      refresh_token
    }
  }
`

export const SIGN_OUT = gql`
  mutation SignOut {
    signOut
  }
`

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile(
    $username: String
    $full_name: String
    $avatar_url: String
    $bio: String
  ) {
    updateProfile(
      username: $username
      full_name: $full_name
      avatar_url: $avatar_url
      bio: $bio
    ) {
      id
      email
      username
      full_name
      avatar_url
      bio
    }
  }
`

// =====================================================
// PROJECT MUTATIONS
// =====================================================
export const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $description: String) {
    createProject(name: $name, description: $description) {
      id
      name
      description
      created_at
    }
  }
`

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $name: String, $description: String, $is_archived: Boolean) {
    updateProject(id: $id, name: $name, description: $description, is_archived: $is_archived) {
      id
      name
      description
      is_archived
    }
  }
`

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`

// =====================================================
// TASK MUTATIONS
// =====================================================
export const CREATE_TASK = gql`
  mutation CreateTask(
    $projectId: ID!
    $title: String!
    $description: String
    $status: TaskStatus
    $priority: TaskPriority
  ) {
    createTask(
      projectId: $projectId
      title: $title
      description: $description
      status: $status
      priority: $priority
    ) {
      id
      title
      description
      status
      priority
      created_at
    }
  }
`

export const UPDATE_TASK = gql`
  mutation UpdateTask(
    $id: ID!
    $title: String
    $description: String
    $status: TaskStatus
    $priority: TaskPriority
  ) {
    updateTask(
      id: $id
      title: $title
      description: $description
      status: $status
      priority: $priority
    ) {
      id
      title
      description
      status
      priority
      updated_at
    }
  }
`

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`

export const ASSIGN_TASK = gql`
  mutation AssignTask($taskId: ID!, $userId: ID!) {
    assignTask(taskId: $taskId, userId: $userId) {
      id
      user {
        id
        username
      }
      assigned_at
    }
  }
`

export const UNASSIGN_TASK = gql`
  mutation UnassignTask($taskId: ID!, $userId: ID!) {
    unassignTask(taskId: $taskId, userId: $userId)
  }
`

// =====================================================
// LABEL MUTATIONS
// =====================================================
export const CREATE_LABEL = gql`
  mutation CreateLabel($name: String!, $color: String!, $scope: LabelScope!, $projectId: ID) {
    createLabel(name: $name, color: $color, scope: $scope, projectId: $projectId) {
      id
      name
      color
      scope
    }
  }
`

export const ADD_LABEL_TO_TASK = gql`
  mutation AddLabelToTask($taskId: ID!, $labelId: ID!) {
    addLabelToTask(taskId: $taskId, labelId: $labelId) {
      id
      labels {
        id
        name
        color
      }
    }
  }
`

export const REMOVE_LABEL_FROM_TASK = gql`
  mutation RemoveLabelFromTask($taskId: ID!, $labelId: ID!) {
    removeLabelFromTask(taskId: $taskId, labelId: $labelId) {
      id
      labels {
        id
        name
        color
      }
    }
  }
`

// =====================================================
// PROJECT MEMBER MUTATIONS
// =====================================================
export const ADD_PROJECT_MEMBER = gql`
  mutation AddProjectMember($projectId: ID!, $userId: ID!, $role: ProjectRole) {
    addProjectMember(projectId: $projectId, userId: $userId, role: $role) {
      id
      user {
        id
        username
        full_name
      }
      role
      joined_at
    }
  }
`

export const REMOVE_PROJECT_MEMBER = gql`
  mutation RemoveProjectMember($projectId: ID!, $userId: ID!) {
    removeProjectMember(projectId: $projectId, userId: $userId)
  }
`

// =====================================================
// COMMENT MUTATIONS
// =====================================================
export const CREATE_COMMENT = gql`
  mutation CreateComment($taskId: ID!, $content: String!) {
    createComment(taskId: $taskId, content: $content) {
      id
      content
      user {
        id
        username
      }
      created_at
    }
  }
`

export const UPDATE_COMMENT = gql`
  mutation UpdateComment($id: ID!, $content: String!) {
    updateComment(id: $id, content: $content) {
      id
      content
      updated_at
    }
  }
`

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`