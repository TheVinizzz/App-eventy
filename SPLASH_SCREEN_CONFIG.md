# Configuração do Splash Screen - EventyApp

## 📱 Configurações Implementadas

### 1. Imagem do Splash Screen
- **Arquivo**: `assets/splash-icon.png`
- **Descrição**: Ícone amarelo sobre fundo escuro, otimizado para todas as plataformas
- **Resolução**: Adequada para diferentes densidades de tela

### 2. Configurações por Plataforma

#### iOS
```json
"ios": {
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#060706",
    "tabletImage": "./assets/splash-icon.png"
  }
}
```

#### Android
```json
"android": {
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#060706",
    "mdpi": "./assets/splash-icon.png",
    "hdpi": "./assets/splash-icon.png",
    "xhdpi": "./assets/splash-icon.png",
    "xxhdpi": "./assets/splash-icon.png",
    "xxxhdpi": "./assets/splash-icon.png"
  }
}
```

#### Web
```json
"web": {
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#060706"
  }
}
```

### 3. Configurações do App.tsx

#### Controle Programático
- **Prevenção de ocultação automática**: `SplashScreen.preventAutoHideAsync()`
- **Tempo mínimo de exibição**: 2 segundos
- **Ocultação manual**: Após carregamento completo dos recursos

#### Fluxo de Carregamento
1. App inicia com splash screen visível
2. Carrega recursos necessários (fontes, dados, etc.)
3. Aguarda tempo mínimo de 2 segundos
4. Oculta o splash screen suavemente
5. Exibe a interface principal

### 4. Cores e Estilo

#### Paleta de Cores
- **Fundo do splash**: `#060706` (preto quase absoluto)
- **Ícone**: Amarelo (#FFD700 aproximadamente)
- **Status bar**: Light content sobre fundo `#060706`

#### Design Responsivo
- **ResizeMode**: `contain` - mantém proporções do ícone
- **Centralização**: Automática em todas as plataformas
- **Suporte a tablets**: Configuração específica para iOS

### 5. Plugins Necessários

```json
"plugins": [
  [
    "expo-splash-screen",
    {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#060706"
    }
  ]
]
```

## 🚀 Como Testar

### Desenvolvimento
```bash
expo start
```

### Pré-visualização
- **iOS**: `expo start --ios`
- **Android**: `expo start --android` 
- **Web**: `expo start --web`

### Build de Produção
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## 📋 Checklist de Verificação

- [x] Splash screen configurado para iOS
- [x] Splash screen configurado para Android  
- [x] Splash screen configurado para Web
- [x] Controle programático implementado
- [x] Tempo mínimo de exibição definido
- [x] Cores consistentes em todas as plataformas
- [x] Plugin expo-splash-screen instalado
- [x] Configuração de multiple densities para Android

## 🎨 Customizações Futuras

### Animações
Para adicionar animações personalizadas ao splash:
1. Usar `react-native-reanimated`
2. Criar componente de splash customizado
3. Implementar transições suaves

### Diferentes Temas
Para suporte a tema claro/escuro:
1. Detectar preferência do sistema
2. Configurar cores condicionalmente
3. Atualizar backgroundColor dinamicamente

## 📁 Arquivos Relacionados

- `app.json` - Configuração básica
- `app.config.js` - Configuração avançada  
- `App.tsx` - Controle programático
- `assets/splash-icon.png` - Imagem do splash
- `package.json` - Dependências necessárias 