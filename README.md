1. Iniciar o Docker Desktop
   Abra o aplicativo Docker Desktop no seu Mac e espere ele iniciar completamente.
2. Subir o banco de dados
   docker compose up -d
3. Criar as tabelas no banco
   push
   npm run db:push
4. Criar os usuários (admin e user)
   npm run db:seed
5. Reiniciar o servidor Next.js
   Pare o npm run dev e inicie novamente para carregar as variáveis de ambiente.
