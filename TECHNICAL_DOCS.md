# Documentação Técnica - EventyApp

## 🏗 Arquitetura do Projeto

### Estrutura de Pastas

```
EventyAppFixed/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   └── ui/             # Componentes de interface
│   ├── navigation/         # Configuração de navegação
│   ├── screens/           # Telas do aplicativo
│   ├── theme/             # Sistema de design
│   ├── types/             # Definições de tipos TypeScript
│   ├── utils/             # Funções utilitárias
│   └── constants/         # Constantes da aplicação
├── assets/                # Recursos estáticos
├── App.tsx               # Componente raiz
└── package.json          # Dependências e scripts
```

## 🎨 Sistema de Design

### Cores

O app utiliza um tema dark moderno com acentos dourados:

```typescript
colors: {
  brand: {
    primary: '#FFD700',     // Dourado principal
    secondary: '#FFC107',   // Âmbar secundário
    background: '#0A0A0A',  // Fundo preto profundo
    card: '#121212',        // Cards preto claro
    textPrimary: '#FFFFFF', // Texto principal branco
    textSecondary: '#B0B0B0' // Texto secundário cinza
  }
}
```

### Tipografia

Sistema de tipografia escalável:

```typescript
typography: {
  fontSizes: {
    xs: 12, sm: 14, md: 16, lg: 18, 
    xl: 20, xxl: 24, xxxl: 32, display: 40
  },
  fontWeights: {
    light: '300', normal: '400', medium: '500',
    semibold: '600', bold: '700', extrabold: '800'
  }
}
```

### Espaçamentos

Grid system consistente:

```typescript
spacing: {
  xs: 4, sm: 8, md: 16, lg: 24, 
  xl: 32, xxl: 48, xxxl: 64
}
```

## 🧩 Componentes

### Button

Componente de botão com múltiplas variantes:

```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}
```

**Variantes:**
- `primary`: Gradiente dourado
- `secondary`: Gradiente âmbar
- `outline`: Borda dourada, fundo transparente
- `ghost`: Apenas texto dourado

### Card

Container com gradientes e bordas:

```typescript
interface CardProps {
  children: React.ReactNode;
  gradient?: boolean;
  padding?: keyof typeof spacing;
  borderColor?: string;
}
```

### Input

Campo de entrada com validação e ícones:

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
}
```

### EventCard

Componente especializado para exibir eventos:

```typescript
interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
  onPress?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}
```

## 🧭 Navegação

### Bottom Tab Navigator

Navegação principal com 5 abas:

1. **Home** - Tela inicial com eventos em destaque
2. **Search** - Busca e filtros de eventos
3. **Tickets** - Ingressos do usuário
4. **Community** - Feed social e stories
5. **Profile** - Perfil e configurações

### Configuração

```typescript
// BottomTabNavigator.tsx
const Tab = createBottomTabNavigator<BottomTabParamList>();

// Blur effect na navegação
tabBarBackground: () => (
  <BlurView intensity={95} tint="dark" />
)
```

## 📱 Telas

### HomeScreen

**Funcionalidades:**
- Header com saudação personalizada
- Eventos em destaque (scroll horizontal)
- Grid de categorias
- Ações rápidas

**Componentes utilizados:**
- `Card` para eventos e categorias
- `Button` para ações
- `ScrollView` para navegação horizontal

### SearchScreen

**Funcionalidades:**
- Campo de busca com ícone
- Filtros por categoria (scroll horizontal)
- Lista de resultados
- Estado vazio e carregamento

### TicketsScreen

**Funcionalidades:**
- Separação por status (ativo/usado)
- Detalhes completos do ingresso
- Botão para QR Code
- Status visual com cores

### CommunityScreen

**Funcionalidades:**
- Stories estilo Instagram
- Feed de posts com interações
- Eventos em alta
- Sistema de likes e comentários

### ProfileScreen

**Funcionalidades:**
- Informações do usuário
- Estatísticas de eventos
- Menu de navegação
- Atividade recente
- Ações rápidas

## 🔧 Utilitários

### Formatação de Dados

```typescript
// Datas
formatDate(date: string | Date): string
formatTime(time: string): string
formatDateTime(date: string, time?: string): string

// Números
formatPrice(price: number, currency?: string): string
formatNumber(number: number): string

// Texto
truncateText(text: string, maxLength: number): string
getInitials(name: string): string
```

### Validação

```typescript
validateEmail(email: string): boolean
validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
}
```

### Performance

```typescript
debounce<T>(func: T, wait: number): Function
throttle<T>(func: T, limit: number): Function
```

## 📊 Tipos de Dados

### Principais Interfaces

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  category: string;
  organizerId: string;
  attendeesCount: number;
}

interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  type: string;
  status: 'active' | 'used' | 'expired';
  qrCode: string;
}
```

## 🚀 Performance

### Otimizações Implementadas

1. **Lazy Loading**: Componentes carregados sob demanda
2. **Memoização**: React.memo em componentes pesados
3. **Debounce**: Busca com delay para reduzir requisições
4. **Throttle**: Limitação de eventos de scroll
5. **FlatList**: Para listas grandes com virtualização

### Métricas Alvo

- **TTI (Time to Interactive)**: < 3s
- **FPS**: 60fps constante
- **Bundle Size**: < 10MB
- **Memory Usage**: < 100MB

## 🔒 Segurança

### Boas Práticas

1. **Validação de Input**: Todos os campos validados
2. **Sanitização**: Dados limpos antes do envio
3. **HTTPS**: Todas as requisições seguras
4. **Token Storage**: AsyncStorage seguro
5. **Deep Linking**: Validação de URLs

## 🧪 Testes

### Estratégia de Testes

```typescript
// Testes de Componente
describe('Button Component', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});

// Testes de Navegação
describe('Navigation', () => {
  it('should navigate between tabs', () => {
    // Test implementation
  });
});

// Testes de Utilitários
describe('Utils', () => {
  it('should format date correctly', () => {
    expect(formatDate('2024-01-15')).toBe('15/01/2024');
  });
});
```

## 📦 Build e Deploy

### Scripts Disponíveis

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

### Configuração de Build

```json
// app.json
{
  "expo": {
    "name": "EventyApp",
    "slug": "eventy-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark"
  }
}
```

## 🔄 Estado da Aplicação

### Gerenciamento de Estado

Atualmente usando estado local com hooks:
- `useState` para estado de componente
- `useEffect` para efeitos colaterais
- Context API para estado global (futuro)

### Futuras Implementações

- **Redux Toolkit** para estado complexo
- **React Query** para cache de dados
- **Zustand** para estado simples

## 📈 Monitoramento

### Métricas a Implementar

1. **Analytics**: Eventos de usuário
2. **Crash Reporting**: Sentry/Bugsnag
3. **Performance**: Flipper/Reactotron
4. **User Feedback**: In-app feedback

## 🔮 Roadmap Técnico

### Próximas Implementações

1. **Offline Support**: Redux Persist + AsyncStorage
2. **Push Notifications**: Expo Notifications
3. **Deep Linking**: React Navigation Deep Links
4. **Biometric Auth**: Expo LocalAuthentication
5. **Camera Integration**: Expo Camera (QR Code)
6. **Maps Integration**: React Native Maps
7. **Payment Integration**: Stripe/PagSeguro
8. **Real-time Chat**: Socket.io
9. **Image Upload**: Expo ImagePicker + Cloudinary
10. **Advanced Animations**: Reanimated 3

---

**Última atualização:** Janeiro 2024  
**Versão:** 1.0.0 