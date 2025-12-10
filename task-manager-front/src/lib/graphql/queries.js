import { gql } from '@apollo/client'

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      username
      full_name
      avatar_url
    }
  }
`

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      is_archived
      owner {
        id
        username
      }
      created_at
    }
  }
`

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      is_archived
      owner {
        id
        username
        full_name
      }
      members {
        id
        user {
          id
          username
          full_name
          avatar_url
        }
        role
        joined_at
      }
      created_at
    }
  }
`

export const GET_TASKS = gql`
  query GetTasks($projectId: ID!) {
    tasks(projectId: $projectId) {
      id
      title
      description
      status
      priority
      due_date
      creator {
        id
        username
      }
      assigned_to {
        id
        username
        avatar_url
      }
      labels {
        id
        name
        color
      }
      created_at
      updated_at
    }
  }
`

export const GET_LABELS = gql`
  query GetLabels($projectId: ID, $scope: LabelScope) {
    labels(projectId: $projectId, scope: $scope) {
      id
      name
      color
      scope
    }
  }
`

export const GET_PROJECT_MEMBERS = gql`
  query GetProjectMembers($projectId: ID!) {
    projectMembers(projectId: $projectId) {
      id
      user {
        id
        username
        full_name
        avatar_url
      }
      role
    }
  }
`