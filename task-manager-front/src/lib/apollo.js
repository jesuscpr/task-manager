import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { CachePersistor, LocalStorageWrapper } from 'apollo3-cache-persist'
import { supabase } from './supabase'

const APOLLO_CACHE_KEY = import.meta.env.VITE_APOLLO_CACHE_KEY || 'task-manager-apollo-cache'
const APOLLO_CACHE_TIMESTAMP_KEY = import.meta.env.VITE_APOLLO_CACHE_TIMESTAMP_KEY || 'task-manager-apollo-cache-ts'
const DEFAULT_APOLLO_CACHE_TTL_MS = 1000 * 60 * 30
const parsedApolloCacheTtlMs = Number(import.meta.env.VITE_APOLLO_CACHE_TTL_MS)
const APOLLO_CACHE_TTL_MS = Number.isFinite(parsedApolloCacheTtlMs) && parsedApolloCacheTtlMs > 0
  ? parsedApolloCacheTtlMs
  : DEFAULT_APOLLO_CACHE_TTL_MS

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

const cache = new InMemoryCache({
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
})

let apolloCachePersistor = null

const updateCacheTimestamp = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APOLLO_CACHE_TIMESTAMP_KEY, String(Date.now()))
}

const cacheTimestampLink = new ApolloLink((operation, forward) => {
  if (!forward) return null
  return forward(operation).map((result) => {
    updateCacheTimestamp()
    return result
  })
})

export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink.concat(cacheTimestampLink.concat(httpLink))),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

export const initializeApolloCache = async () => {
  if (typeof window === 'undefined') return

  if (!apolloCachePersistor) {
    apolloCachePersistor = new CachePersistor({
      cache,
      storage: new LocalStorageWrapper(window.localStorage),
      key: APOLLO_CACHE_KEY,
      trigger: 'write',
      debounce: 300,
    })
  }

  const savedTimestamp = Number(window.localStorage.getItem(APOLLO_CACHE_TIMESTAMP_KEY))
  const isExpired = Number.isFinite(savedTimestamp) && Date.now() - savedTimestamp > APOLLO_CACHE_TTL_MS

  if (isExpired) {
    await apolloCachePersistor.purge()
    window.localStorage.removeItem(APOLLO_CACHE_TIMESTAMP_KEY)
  }

  await apolloCachePersistor.restore()
}

export const clearApolloCache = async () => {
  try {
    if (apolloCachePersistor) {
      await apolloCachePersistor.purge()
    } else if (typeof window !== 'undefined') {
      window.localStorage.removeItem(APOLLO_CACHE_KEY)
    }
  } finally {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(APOLLO_CACHE_TIMESTAMP_KEY)
      window.localStorage.removeItem('activeProjectId')
    }
    await apolloClient.clearStore()
  }
}