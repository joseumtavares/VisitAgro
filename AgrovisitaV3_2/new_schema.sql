-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.visitapro_clients (
  id text NOT NULL,
  nome text NOT NULL,
  tel text,
  estudas text,
  status text DEFAULT 'interessado'::text,
  endereco text,
  obs text,
  maps_link text,
  lat double precision,
  lng double precision,
  updated_at timestamp with time zone DEFAULT now(),
  user_id text,
  indicado text,
  CONSTRAINT visitapro_clients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.visitapro_users (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  username text NOT NULL UNIQUE,
  pass_hash text NOT NULL,
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['admin'::text, 'user'::text])),
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  CONSTRAINT visitapro_users_pkey PRIMARY KEY (id)
);