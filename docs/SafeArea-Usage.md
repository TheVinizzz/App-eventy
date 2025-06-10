# SafeArea - Guia de Uso

## Visão Geral

Este projeto implementa uma solução inteligente e escalável para lidar com SafeArea em diferentes plataformas (iOS e Android), garantindo que o conteúdo seja exibido corretamente sem sobreposições com barras de sistema.

## Comportamento por Plataforma

- **iOS**: Mantém o comportamento nativo do SafeAreaView - sem padding adicional
- **Android**: Adiciona padding customizado para evitar sobreposição com a status bar

## Opções de Implementação

### 1. Componente PlatformSafeAreaView (Recomendado)

```tsx
import { PlatformSafeAreaView } from '@/components/ui';

export const MyScreen: React.FC = () => {
  return (
    <PlatformSafeAreaView>
      <StatusBar barStyle="light-content" />
      {/* Seu conteúdo aqui */}
    </PlatformSafeAreaView>
  );
};
```

**Opções do componente:**
```tsx
<PlatformSafeAreaView
  edges={['top', 'bottom']}     // Quais edges aplicar
  mode="padding"                // 'padding' ou 'margin'
  style={{ backgroundColor: 'red' }}
>
  {/* conteúdo */}
</PlatformSafeAreaView>
```

### 2. Hook useSafeArea com Estilos Prontos

```tsx
import { useSafeArea } from '@/hooks/useSafeArea';

export const MyScreen: React.FC = () => {
  const { styles, applyTopPadding } = useSafeArea();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Header com padding automático */}
      </View>
      
      {/* OU aplicar manualmente: */}
      <View style={applyTopPadding(styles.customHeader)}>
        {/* Header customizado */}
      </View>
    </SafeAreaView>
  );
};
```

### 3. Hook useSafeArea com Métodos Utilitários

```tsx
const { applyTopPadding, applyBottomPadding, applyAllPadding } = useSafeArea();

// Aplicar apenas padding superior
<View style={applyTopPadding(styles.header)} />

// Aplicar apenas padding inferior  
<View style={applyBottomPadding(styles.footer)} />

// Aplicar padding em todos os lados
<View style={applyAllPadding(styles.container)} />
```

## Migração de Telas Existentes

### Antes (Abordagem Manual):
```tsx
const { topPadding, isAndroid } = useSafeArea();

<View style={[styles.header, isAndroid && { paddingTop: topPadding }]}>
```

### Depois (Abordagem Escalável):
```tsx
const { applyTopPadding } = useSafeArea();

<View style={applyTopPadding(styles.header)}>
```

## Vantagens da Nova Abordagem

1. **Escalabilidade**: Não precisa modificar cada tela individualmente
2. **Consistência**: Comportamento uniforme em todas as telas
3. **Manutenibilidade**: Lógica centralizada em um local
4. **Flexibilidade**: Múltiplas opções de implementação
5. **Tipo-Safety**: TypeScript completo
6. **Performance**: Cálculos otimizados e reutilizáveis

## Exemplos de Uso Avançado

### Tela com Header Customizado
```tsx
export const CustomScreen: React.FC = () => {
  const { applyTopPadding, styles } = useSafeArea();

  return (
    <View style={styles.container}>
      <View style={applyTopPadding({ 
        backgroundColor: 'blue',
        paddingHorizontal: 16 
      })}>
        <Text>Header com padding inteligente</Text>
      </View>
    </View>
  );
};
```

### Modal com SafeArea
```tsx
<PlatformSafeAreaView edges={['top']} mode="margin">
  <Modal>
    {/* Conteúdo do modal */}
  </Modal>
</PlatformSafeAreaView>
```

## Migração de Projeto

Para migrar todo o projeto para a nova abordagem:

1. Substitua `SafeAreaView` por `PlatformSafeAreaView` onde apropriado
2. Use `applyTopPadding()` para headers personalizados
3. Use `styles.header` do hook para casos simples
4. Remova lógica manual de `isAndroid && { paddingTop: ... }`

Esta abordagem garante que o app funcione perfeitamente em ambas as plataformas com código limpo e manutenível. 