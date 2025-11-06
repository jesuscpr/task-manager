import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import { typeDefs } from './graphql/typeDefs/index.js';
import { resolvers } from './graphql/resolvers/index.js';
import { supabase, getSupabaseClient } from './config/supabase.js';

const app = express();
const PORT = process.env.PORT || 4000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(cors());
app.use(express.json());

app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) => {
    // Obtener token del header Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Verificar el token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        return {
          user,
          supabase: getSupabaseClient(token),
        };
      }
    }
    
    // Si no hay token o es inválido, retornar supabase sin autenticar
    return {
      user: null,
      supabase,
    };
  },
}));

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
});