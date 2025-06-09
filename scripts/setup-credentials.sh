#!/bin/bash

# Script para configurar credenciais Android de forma definitiva
set -e

echo "🔧 Configurando credenciais Android para produção..."

echo "📋 Passo 1: Verificando configuração atual..."
eas credentials --platform android

echo "📋 Passo 2: Configurando build credentials..."
eas credentials:configure-build --platform android --profile production

echo "📋 Passo 3: Verificando se Google Service Account está configurado..."
if [ ! -f "google-service-account.json" ]; then
    echo "⚠️  Google Service Account não encontrado!"
    echo "👉 Crie o arquivo google-service-account.json com as credenciais do Google Play Console"
    echo "👉 Guia: https://expo.fyi/creating-google-service-account"
fi

echo "📋 Passo 4: Testando build..."
echo "Execute: eas build --platform android --profile production --no-wait"

echo "✅ Configuração concluída!"
echo ""
echo "🔍 Próximos passos:"
echo "1. Verifique se o certificado SHA1 no EAS corresponde ao Google Play Console"
echo "2. Se não corresponder, use o mesmo certificado em ambos os locais"
echo "3. Configure o Google Service Account para submissions automáticas" 