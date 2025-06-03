# Trending Events - Setup e Teste

## 📋 Visão Geral

A funcionalidade "Trending Agora" mostra eventos que estão ganhando popularidade baseado em atividade recente (últimos 7 dias) e atividade total. O algoritmo considera:

- **Confirmações de presença recentes** (peso 5)
- **Posts sobre o evento** (peso 3) 
- **Reviews recentes** (peso 4)
- **Tickets vendidos** (peso 1)

## 🚀 Como Configurar

### 1. Backend Setup

```bash
# Navegar para o backend
cd backend

# Instalar dependências
npm install

# Configurar banco de dados
npx prisma generate
npx prisma db push

# Seed com dados básicos (se necessário)
npm run seed

# Iniciar o servidor
npm run start:dev
```

### 2. Frontend Setup

```bash
# Navegar para o frontend
cd EventyAppFixed

# Instalar dependências
npm install

# Iniciar o app
npm start
```

## 🧪 Como Testar

### 1. Testar API Diretamente

```bash
# No diretório EventyAppFixed
node test-trending.js
```

### 2. Testar no App

1. Abra o app React Native
2. Navegue para a tela Home
3. Role até a seção "Trending Agora"
4. Verifique se os eventos aparecem com:
   - Badges coloridos baseados no nível de atividade
   - Percentuais de crescimento
   - Informações de attendances e posts
   - Preços formatados

### 3. Verificar Endpoints

```bash
# Trending events (público)
curl http://localhost:3001/api/public/trending?limit=5

# Com autenticação (se necessário)
curl http://localhost:3001/api/social/feed/trending?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Estrutura de Dados

### TrendingEvent Interface

```typescript
interface TrendingEvent {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  location: string;
  attendances: number;
  posts: number;
  reviews: number;
  tickets: number;
  activityLevel: 'low' | 'medium' | 'high' | 'trending';
  price?: string;
  category?: string;
  rating?: number;
  trendingScore?: number;
  recentActivityScore?: number;
}
```

### Activity Levels

- **trending**: `recentActivityScore > 20` (🔥 Laranja vibrante)
- **high**: `recentActivityScore > 10` (📈 Laranja)
- **medium**: `recentActivityScore > 5` (⬆️ Dourado)
- **low**: `recentActivityScore <= 5` (↗️ Verde claro)

## 🎨 Componentes

### TrendingEvents Component

- **Localização**: `src/components/TrendingEvents.tsx`
- **Props**: `onEventPress`, `limit`
- **Features**:
  - Loading states
  - Error handling
  - Empty states
  - Cache com 3 minutos
  - Badges dinâmicos
  - Percentuais calculados

### HomeScreen Integration

- **Localização**: `src/screens/HomeScreen.tsx`
- **Seção**: "Trending Agora"
- **Substituiu**: Array hardcoded por dados reais da API

## 🔧 Configuração de Cache

```typescript
// src/config/performance.ts
cacheConfig: {
  trendingEvents: 3 * 60 * 1000, // 3 minutos
}
```

## 🐛 Troubleshooting

### Problema: Nenhum evento trending aparece

**Solução**: Verificar se existem eventos publicados no banco:

```sql
SELECT COUNT(*) FROM Event WHERE published = true AND date >= NOW();
```

### Problema: Todos os eventos têm activityLevel 'low'

**Solução**: Criar dados de atividade recente:

```bash
cd backend
npx ts-node prisma/seed-trending.ts
```

### Problema: API retorna erro 500

**Solução**: Verificar logs do backend e estrutura do banco:

```bash
# Verificar se as tabelas existem
npx prisma studio

# Verificar logs
npm run start:dev
```

## 📈 Algoritmo de Trending Score

```typescript
// Score de atividade recente (últimos 7 dias)
const recentActivityScore = 
  recentAttendances * 5 +  // Peso maior para confirmações
  recentPosts * 3 +        // Posts sobre o evento
  recentReviews * 4;       // Reviews recentes

// Score total (atividade histórica)
const totalActivityScore = 
  totalAttendances * 2 +
  totalPosts * 1.5 +
  totalReviews * 3 +
  totalTickets * 1;

// Score final (prioriza atividade recente)
const trendingScore = (recentActivityScore * 3) + totalActivityScore;
```

## 🎯 Próximos Passos

1. **Implementar dados reais**: Substituir seed por dados reais de atividade
2. **Melhorar algoritmo**: Considerar fatores como localização, horário
3. **Analytics**: Adicionar tracking de cliques em trending events
4. **Personalização**: Trending baseado no perfil do usuário
5. **Real-time**: WebSocket para updates em tempo real 