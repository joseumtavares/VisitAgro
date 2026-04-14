-- ========================================================
-- Migration: 010_pre_registrations_rls.sql
-- Versão: v0.9.4
-- Descrição: Habilita RLS e políticas para pre_registrations
-- Data: 2026-01-03
-- ========================================================

BEGIN;

-- Habilitar RLS
ALTER TABLE public.pre_registrations ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem CRUD dentro do seu workspace
CREATE POLICY "acesso_pre_registrations_por_workspace" 
  ON public.pre_registrations
  FOR ALL 
  USING (
    workspace = COALESCE(
      NULLIF(current_setting('app.current_workspace', true), ''),
      'principal'
    )
  );

-- Índice para performance de listagem
CREATE INDEX IF NOT EXISTS idx_pre_registrations_workspace_created 
  ON public.pre_registrations(workspace, created_at DESC);

-- Índice para filtro por status
CREATE INDEX IF NOT EXISTS idx_pre_registrations_status 
  ON public.pre_registrations(workspace, status);

COMMIT;
