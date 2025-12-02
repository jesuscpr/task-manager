import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { supabase } from './supabase'

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
})

// Middleware para añadir el token en cada request
const authLink = setContext(async (_, { headers }) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  return {
    headers: {
      ...headers,
      authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
    }
  }
})

// Manejo de errores global
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    })
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }
})

export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          projects: {
            merge(existing = [], incoming) {
              return incoming
            }
          },
          tasks: {
            merge(existing = [], incoming) {
              return incoming
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})