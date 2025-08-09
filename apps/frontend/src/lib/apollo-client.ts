import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Create HTTP link to the GraphQL server
const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  connectToDevTools: import.meta.env.DEV,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});