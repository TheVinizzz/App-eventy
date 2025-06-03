# EventyApp - React Native

Um aplicativo moderno de eventos desenvolvido com React Native e Expo, baseado no design do frontend web existente.

## 🚀 Características

- **Design Moderno**: Interface elegante com tema dark e cores douradas
- **Navegação Intuitiva**: Bottom tabs com blur effect e animações suaves
- **Componentes Reutilizáveis**: Sistema de design consistente
- **TypeScript**: Tipagem completa para melhor desenvolvimento
- **Expo SDK 53**: Versão mais recente com recursos modernos

## 📱 Telas Principais

### 🏠 Home
- Eventos em destaque
- Categorias de eventos
- Ações rápidas
- Interface com gradientes e cards modernos

### 🔍 Buscar
- Campo de busca com ícones
- Filtros por categoria
- Lista de eventos com detalhes
- Resultados em tempo real

### 🎫 Ingressos
- Ingressos ativos e utilizados
- Status visual com cores
- Botão para QR Code
- Detalhes completos dos eventos

### 👥 Comunidade
- Feed de posts da comunidade
- Stories estilo Instagram
- Eventos em alta
- Interações sociais (likes, comentários)

### 👤 Perfil
- Informações do usuário
- Estatísticas de eventos
- Menu de configurações
- Atividade recente

## 🎨 Design System

### Cores
- **Primary**: #FFD700 (Dourado)
- **Secondary**: #FFC107 (Âmbar)
- **Background**: #0A0A0A (Preto profundo)
- **Card**: #121212 (Preto claro)
- **Text Primary**: #FFFFFF (Branco)
- **Text Secondary**: #B0B0B0 (Cinza claro)

### Componentes
- **Button**: Variantes primary, secondary, outline, ghost
- **Card**: Com gradientes e bordas personalizadas
- **Input**: Campo de entrada com ícones e validação
- **Navigation**: Bottom tabs com blur effect

## 🛠 Tecnologias

- **React Native 0.79.2**
- **Expo SDK 53**
- **TypeScript**
- **React Navigation 7**
- **Expo Linear Gradient**
- **Expo Blur**
- **React Native Safe Area Context**
- **Expo Vector Icons**

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd EventyAppFixed
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o projeto:
```bash
npm start
```

4. Use o Expo Go para testar no dispositivo ou execute em um emulador.

## 📁 Estrutura do Projeto

```
src/
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── index.ts
├── navigation/
│   ├── BottomTabNavigator.tsx
│   └── types.ts
├── screens/
│   ├── HomeScreen.tsx
│   ├── SearchScreen.tsx
│   ├── TicketsScreen.tsx
│   ├── CommunityScreen.tsx
│   └── ProfileScreen.tsx
└── theme/
    ├── colors.ts
    ├── spacing.ts
    ├── typography.ts
    └── index.ts
```

## 🎯 Funcionalidades Implementadas

### ✅ Navegação
- [x] Bottom tabs com 5 telas principais
- [x] Blur effect na navegação
- [x] Ícones animados
- [x] Safe area handling

### ✅ Telas
- [x] Home com eventos em destaque
- [x] Busca com filtros
- [x] Ingressos com status
- [x] Comunidade com feed social
- [x] Perfil completo

### ✅ Componentes UI
- [x] Button com variantes
- [x] Card com gradientes
- [x] Input com validação
- [x] Sistema de cores consistente

### ✅ Design
- [x] Tema dark moderno
- [x] Gradientes e sombras
- [x] Tipografia consistente
- [x] Espaçamentos padronizados

## 🚧 Próximos Passos

- [ ] Integração com API
- [ ] Autenticação de usuários
- [ ] Push notifications
- [ ] Câmera para QR Code
- [ ] Mapas para localização
- [ ] Pagamentos integrados
- [ ] Chat em tempo real
- [ ] Upload de imagens
- [ ] Filtros avançados
- [ ] Modo offline

## 📱 Compatibilidade

- **iOS**: 13.0+
- **Android**: API 21+
- **Expo Go**: Compatível
- **Expo Dev Build**: Recomendado para produção

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Desenvolvido por

Baseado no frontend web existente, adaptado para React Native com design moderno e funcionalidades mobile-first.

---

**EventyApp** - Conectando pessoas através de eventos incríveis! 🎉 