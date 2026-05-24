#!/bin/sh
# ==========================================================================
# SCRIPT DE VALIDACIÓN PRE-COMMIT - MARKETO
# ==========================================================================

echo "🔍 [Marketo CI] Iniciando verificación de tipos de TypeScript..."

# Ejecutar el compilador de TypeScript sin emitir archivos
# Esto forzará la revisión de AppContext.tsx y el resto del proyecto
npm run type-check

status=$?

if [ $status -ne 0 ]; then
  echo ""
  echo "❌ ERROR: Se detectaron inconsistencias de tipos en el código."
  echo "⚠️  El commit ha sido bloqueado. Corrige los errores antes de intentar de nuevo."
  exit 1
fi

echo "✅ [Marketo CI] Validación exitosa. Procediendo con el commit..."
exit 0