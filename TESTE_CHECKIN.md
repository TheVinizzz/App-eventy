# Teste do Sistema de Check-in

## 🧪 Debugging e Teste

### ✨ NOVA IMPLEMENTAÇÃO - Idêntica ao Frontend Web

O app mobile agora usa **exatamente a mesma lógica** do frontend web:

**Fluxo Frontend Web = App Mobile:**
1. **QR Code escaneado** = **Ticket ID**
2. `getTicketCheckinInfo(ticketId)` → Valida e obtém dados completos
3. `checkinTicket(ticketId)` → Realiza o check-in

### QR Codes de Teste
Como o QR code agora é tratado como ticket ID diretamente, use IDs reais do banco de dados.

### ⚙️ Processo de Check-in (Novo - Igual ao Web)

#### Etapa 1: Obter Informações do Ticket
- **QR Code = Ticket ID**
- Endpoint: `GET /tickets/{ticketId}/checkin-info`
- Valida: evento correto, status ativo, não usado

#### Etapa 2: Realizar Check-in
- Endpoint: `POST /tickets/{ticketId}/checkin`
- Atualiza status para USED e adiciona timestamp

### 📋 Checklist de Debugging

#### 1. **Verificar Conexão com Backend**
- [ ] URL da API está correta em `constants/index.ts`
- [ ] Backend está rodando e acessível
- [ ] Token JWT válido no AsyncStorage

#### 2. **Verificar Logs do Console**
Agora você verá logs idênticos ao frontend web:
```
🎯 Starting check-in process: { qrCode: "ticket-id-123", eventId: "event-456" }
🎫 Using QR code as ticket ID: ticket-id-123
📋 Step 1: Getting ticket check-in info...
🔍 Getting ticket check-in info for ID: ticket-id-123
✅ Ticket check-in info response: { id: "ticket-id-123", status: "ACTIVE", ... }
✅ Got ticket data: { user: { name: "João Silva" }, ... }
🎫 Step 2: Performing check-in...
🎫 Performing check-in for ticket ID: ticket-id-123
✅ Check-in response: { success: true, message: "Check-in realizado com sucesso" }
```

#### 3. **Verificar Rotas do Backend**
- ✅ `GET /tickets/{ticketId}/checkin-info` (obter dados do ticket)
- ✅ `POST /tickets/{ticketId}/checkin` (realizar check-in)
- ✅ `GET /tickets/event/:eventId/realtime-stats` (estatísticas)

#### 4. **Testando Diferentes Cenários**

##### ✅ Teste 1: Ticket ID Válido
1. Abra a tela de Check-in
2. Use um ticket ID real do banco de dados
3. **Esperado**: 
   - Log "📋 Step 1: Getting ticket check-in info..."
   - Log "✅ Got ticket data: { user: { name: ... } }"
   - Log "🎫 Step 2: Performing check-in..."
   - Modal verde "Check-in realizado com sucesso para [Nome]!"

##### ❌ Teste 2: Ticket ID Inválido (404)
1. Digite um ID que não existe: `invalid-ticket-id`
2. **Esperado**: 
   - Log "❌ Error status: 404"
   - Modal vermelho "Ingresso não encontrado. Verifique se o QR code está correto."

##### ⚠️ Teste 3: Sem Permissão (403)
1. Use ticket ID válido mas usuário sem permissão
2. **Esperado**: 
   - Log "❌ Error status: 403"
   - Modal vermelho "Você não tem permissão para fazer check-in neste evento."

##### 🔄 Teste 4: Ticket Já Usado
1. Use ticket ID que já foi usado
2. **Esperado**:
   - Etapa 1 passa, mas valida que já foi usado
   - Modal laranja "Check-in já foi realizado em DD/MM/YYYY às HH:mm."

##### 🎭 Teste 5: Evento Errado
1. Use ticket ID de outro evento
2. **Esperado**:
   - Etapa 1 passa, mas valida evento
   - Modal vermelho "Este ingresso não pertence a este evento."

### 🔧 Problemas Comuns e Soluções

#### Problema: "Ingresso não encontrado"
**Possíveis causas:**
1. **Ticket ID não existe** - Verificar no banco de dados
2. **QR Code malformado** - Verificar se é um ID válido
3. **Backend offline** - Verificar conexão

#### Problema: "Sem permissão para fazer check-in"
**Soluções:**
1. Verificar se usuário é criador do evento ou admin
2. Verificar token JWT no header
3. Verificar se evento existe e está correto

#### Problema: Etapa 1 funciona, Etapa 2 falha
**Verificar:**
1. Permissões do usuário para check-in
2. Se ticket ainda está ACTIVE
3. Logs de erro detalhados da etapa 2

### 📱 Testando no Dispositivo

#### Como Obter um Ticket ID Real
1. Acesse o banco de dados ou Prisma Studio
2. Copie um ID de ticket válido
3. Use na entrada manual

#### Entrada Manual
1. Toque no ícone 🔢 no header
2. Digite um ticket ID real: `cm4abc123def456ghi`
3. Toque em "Check-in"
4. **Observe os logs das 2 etapas**

#### Scanner QR
1. Permita acesso à câmera
2. Gere um QR com o ticket ID real
3. **Aguarde processamento das 2 etapas**

### 🐛 Debug Avançado

#### Network Logs Detalhados
```javascript
// Etapa 1 - Obter dados do ticket
🔍 Getting ticket check-in info for ID: cm4abc123def456ghi
✅ Ticket check-in info response: {
  id: "cm4abc123def456ghi",
  status: "ACTIVE",
  user: { name: "João Silva", email: "joao@example.com" },
  event: { id: "event-123", title: "Evento Teste" }
}

// Etapa 2 - Realizar check-in
🎫 Performing check-in for ticket ID: cm4abc123def456ghi
✅ Check-in response: {
  success: true,
  message: "Check-in realizado com sucesso",
  ticket: { /* dados atualizados */ }
}
```

#### Códigos de Erro HTTP
- **404**: Ticket não encontrado
- **403**: Sem permissão  
- **400**: Ticket inativo/cancelado
- **409**: Ticket já usado
- **401**: Token inválido/expirado
- **500**: Erro interno do servidor

#### Estrutura de Resposta `TicketCheckinInfo`
```typescript
{
  id: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  checkedInAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  event: {
    id: string;
    title: string;
    date: string;
  };
  ticketBatch: {
    id: string;
    name: string;
    price: number;
  } | null;
}
```

### ✅ Validação Final

Antes de usar em produção, verificar:
- [ ] Fluxo idêntico ao frontend web
- [ ] Scanner QR funciona com ticket IDs reais
- [ ] Entrada manual funciona com ticket IDs reais
- [ ] Todos os códigos de erro são tratados
- [ ] Logs mostram URLs e dados detalhados
- [ ] Estatísticas atualizam após check-in
- [ ] Feedback específico para cada tipo de erro
- [ ] Performance é boa (< 2s total para ambas etapas)

---

**🎯 Sistema agora 100% idêntico ao frontend web - máxima compatibilidade garantida!** 