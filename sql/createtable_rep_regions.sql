CREATE TABLE IF NOT EXISTS public.rep_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace text NOT NULL,
  rep_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  state char(2) NOT NULL,
  city text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_rep_regions_workspace_rep_state_city
ON public.rep_regions (workspace, rep_id, state, city);

CREATE INDEX IF NOT EXISTS idx_rep_regions_rep_id
ON public.rep_regions (rep_id);

CREATE INDEX IF NOT EXISTS idx_rep_regions_workspace_state_city
ON public.rep_regions (workspace, state, city);