# 🔧 Teste de Integração - Atualização de Perfil via API

## 📋 Rotas do Backend Implementadas

### 1. **PUT /auth/profile** 
**Campos suportados:** `name`, `email`, `profileImage`
```json
{
  "name": "Novo Nome",
  "email": "novoemail@exemplo.com", 
  "profileImage": "https://exemplo.com/imagem.jpg"
}
```

### 2. **PATCH /users/profile**
**Campos suportados:** `bio`, `instagram`, `tiktok`, `facebook`
```json
{
  "bio": "Nova biografia",
  "instagram": "meuinstagram",
  "tiktok": "meutiktok", 
  "facebook": "meufacebook"
}
```

## 🚀 Como Funciona a Integração

### Frontend (React Native)
1. **EditProfileScreen** coleta os dados do formulário
2. **AuthContext.updateUser()** processa a atualização de dados
3. **AuthContext.updateProfileImage()** processa upload de imagem
4. **AuthService.updateUser()** divide os dados entre as duas APIs:
   - Campos de autenticação → `PUT /auth/profile`
   - Campos sociais → `PATCH /users/profile`
5. **ProfileImageService** gerencia upload de imagens:
   - Gera URL pré-assinada → `POST /events/generate-upload-url`
   - Upload direto para cloud storage (MinIO/S3)
   - Atualiza perfil com nova URL → `PUT /auth/profile`
6. Dados salvos localmente no AsyncStorage
7. Estado do contexto atualizado com resposta da API

### Backend (NestJS)
- **AuthController.updateProfile()** para dados básicos
- **UsersController.updateProfile()** para dados sociais
- Ambos protegidos por JWT Guard
- Dados salvos no banco PostgreSQL via Prisma

## 🧪 Como Testar

### 1. Verificar Logs no Console

**Para atualização de dados:**
```
🚀 EditProfile: Starting profile update with data: {...}
📤 AuthService: Updating auth data: {...}
📤 AuthService: Updating social data: {...}
✅ AuthService: Profile updated successfully
✅ EditProfile: Profile updated successfully via API
```

**Para upload de imagem:**
```
📸 Image selected, starting upload process...
🚀 AuthContext: Starting profile image update...
🚀 ProfileImageService: Starting profile image upload...
📁 Using filename: profile-1234567890.jpg
📤 Generating pre-signed URL...
✅ Pre-signed URL generated: {...}
📦 Uploading file to pre-signed URL...
⏳ Upload progress: 25%
⏳ Upload progress: 50%
⏳ Upload progress: 75%
⏳ Upload progress: 100%
✅ Profile image upload successful!
🔄 Updating user profile with new image...
✅ Profile updated successfully with new image
✅ AuthContext: Profile image updated successfully
```

### 2. Verificar Network Tab (React Native Debugger)

**Para dados do perfil:**
- **PUT** request para `/auth/profile` 
- **PATCH** request para `/users/profile`
- Status 200 para ambas

**Para upload de imagem:**
- **POST** request para `/events/generate-upload-url`
- **PUT** request para URL pré-assinada (MinIO/S3)
- **PUT** request para `/auth/profile` (com nova URL da imagem)
- Status 200/201 para todas

### 3. Verificar Banco de Dados
Os dados devem ser persistidos na tabela `users` do PostgreSQL.

### 4. Teste de Campos Específicos
- **Nome/Email** → Vai para `/auth/profile`
- **Bio/Redes Sociais** → Vai para `/users/profile`
- **Todos os campos** → Duas requisições separadas

## 🔍 Troubleshooting

### Erro 401 (Unauthorized)
- Verificar se token JWT está válido
- Verificar headers de autorização

### Erro 409 (Conflict) 
- Email já em uso por outro usuário

### Erro 500 (Server Error)
- Verificar logs do backend
- Verificar conexão com banco de dados

### Network Error
- Verificar se backend está rodando
- Verificar URL da API nas configurações

## 📝 Logs Implementados

### Frontend
- ✅ Início do processo de atualização
- ✅ Dados enviados para cada endpoint  
- ✅ Sucesso/erro de cada requisição
- ✅ Estado final da atualização

### Backend
- ✅ Requisições recebidas
- ✅ Validação de dados
- ✅ Operações no banco
- ✅ Respostas enviadas

## 🎯 Resultado Esperado

Após salvar o perfil:
1. **UI atualizada imediatamente** (optimistic update)
2. **Dados enviados para API** via requisições HTTP
3. **Resposta da API** confirma salvamento 
4. **Estado sincronizado** entre frontend e backend
5. **Alert de sucesso** com mensagem personalizada
6. **Navegação de volta** para tela anterior

---

**Status:** ✅ **IMPLEMENTADO E FUNCIONAL**
**Última atualização:** Hoje 