# Sistema de Afiliados - Implementação Completa

## Visão Geral
Sistema completo de afiliados integrado entre frontend (React Native) e backend (NestJS) com dados reais do banco de dados.

## Backend - Endpoints Implementados

### Base URL: `/events/:id/affiliates`

#### 1. **GET** `/events/:id/affiliates`
- **Descrição**: Lista todos os afiliados de um evento com estatísticas
- **Auth**: JWT Bearer Token
- **Resposta**: Array de afiliados com estatísticas de vendas

#### 2. **GET** `/events/:id/affiliates/stats`
- **Descrição**: Estatísticas gerais de afiliados do evento
- **Auth**: JWT Bearer Token
- **Resposta**: Objeto com métricas agregadas

#### 3. **GET** `/events/:id/affiliates/search?q=query`
- **Descrição**: Busca usuários para adicionar como afiliados
- **Auth**: JWT Bearer Token
- **Parâmetros**: `q` (string) - termo de busca
- **Resposta**: Array de usuários encontrados

#### 4. **POST** `/events/:id/affiliates`
- **Descrição**: Adiciona um novo afiliado ao evento
- **Auth**: JWT Bearer Token
- **Body**:
  ```json
  {
    "userId": "string",
    "eventId": "string", 
    "commissionType": "PERCENTAGE" | "FIXED_AMOUNT",
    "commissionValue": number
  }
  ```

#### 5. **PATCH** `/events/:id/affiliates/:affiliateId`
- **Descrição**: Atualiza configurações de um afiliado
- **Auth**: JWT Bearer Token
- **Body**: Objeto com campos a serem atualizados

#### 6. **DELETE** `/events/:id/affiliates/:affiliateId`
- **Descrição**: Remove um afiliado do evento
- **Auth**: JWT Bearer Token

#### 7. **POST** `/events/:id/affiliates/generate-link`
- **Descrição**: Gera link de afiliado
- **Auth**: JWT Bearer Token
- **Body**: `{ "affiliateCode": "string" }`

## Backend - Serviços

### AffiliatesService
- `getEventAffiliatesWithStats()` - Retorna afiliados com estatísticas calculadas
- `getEventAffiliateStats()` - Métricas agregadas do evento
- `createAffiliate()` - Criação de novos afiliados
- `updateEventAffiliate()` - Atualização de afiliados
- `deleteAffiliate()` - Remoção de afiliados
- `generateAffiliateLink()` - Geração de links únicos

### UsersService
- `searchUsersForAffiliate()` - Busca de usuários para afiliação

## Frontend - Tela de Afiliados

### EventAffiliatesScreen
- **Localização**: `src/screens/EventAffiliatesScreen.tsx`
- **Funcionalidades**:
  - Listagem de afiliados com estatísticas
  - Busca e adição de novos afiliados
  - Edição de comissões
  - Ativação/desativação de afiliados
  - Geração e compartilhamento de links
  - Remoção de afiliados

### Integração API
- **Serviço**: `src/services/eventsService.ts`
- **Métodos**:
  - `fetchEventAffiliates()`
  - `fetchAffiliateStats()`
  - `searchUsersForAffiliate()`
  - `addAffiliate()`
  - `updateAffiliate()`
  - `removeAffiliate()`
  - `generateAffiliateLink()`

## Modelos de Dados

### Affiliate
```typescript
interface Affiliate {
  id: string;
  userId: string;
  eventId: string;
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  commissionValue: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  affiliateCode: string;
  totalSales: number;
  totalCommission: number;
  clicksCount: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}
```

### AffiliateStats
```typescript
interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalCommissionPaid: number;
  totalSalesFromAffiliates: number;
  averageCommissionRate: number;
  topPerformers: Array<{
    affiliate: Affiliate;
    sales: number;
    commission: number;
  }>;
}
```

## Banco de Dados

### Tabelas Utilizadas
- `EventAffiliate` - Relacionamento evento-afiliado
- `AffiliateSale` - Vendas realizadas por afiliados
- `User` - Dados dos usuários/afiliados
- `Event` - Dados dos eventos
- `Coupon` - Cupons automáticos para tracking

## Recursos Implementados

### ✅ Funcionalidades Completas
- [x] Listagem de afiliados com estatísticas reais
- [x] Busca de usuários para afiliação
- [x] Adição de novos afiliados
- [x] Edição de comissões e configurações
- [x] Ativação/desativação de afiliados
- [x] Geração de links únicos
- [x] Compartilhamento de links
- [x] Remoção de afiliados
- [x] Cálculo de estatísticas (vendas, comissões, conversão)
- [x] Validação de permissões
- [x] Tratamento de erros
- [x] Interface responsiva

### 🔒 Segurança
- [x] Autenticação JWT obrigatória
- [x] Validação de propriedade do evento
- [x] Verificação de permissões de admin
- [x] Validação de dados de entrada
- [x] Sanitização de queries

### 📊 Métricas
- [x] Total de vendas por afiliado
- [x] Comissão total paga
- [x] Taxa de conversão calculada
- [x] Ranking de performance
- [x] Estatísticas agregadas do evento

## Como Usar

### 1. Configurar Backend
```bash
cd backend
npm install
npm run start:dev
```

### 2. Configurar Frontend  
```bash
cd EventyAppFixed
npm install
npm start
```

### 3. Acessar Sistema
1. Faça login na aplicação
2. Navegue para um evento criado por você
3. Acesse "Afiliados" no menu do evento
4. Use o botão "+" para adicionar afiliados
5. Configure comissões e gere links

## Ambiente de Produção

### Configurações Necessárias
- URL do backend configurada em `src/constants/index.ts`
- Variáveis de ambiente do backend (DATABASE_URL, JWT_SECRET, etc.)
- CORS configurado para domínio de produção
- HTTPS habilitado

### Deploy
- Backend: Verificar se todas as migrações do Prisma foram aplicadas
- Frontend: Build para produção com URLs corretas
- Banco: Backup antes de mudanças em produção

---

**Status**: ✅ Implementação Completa para Produção
**Última Atualização**: Janeiro 2025 