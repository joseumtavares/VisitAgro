import type { NextRequest } from 'next/server';

/** Lê o contexto injetado pelo `middleware.ts` nos headers da request (não da response). */
export function getRequestContext(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') || '',
    username: req.headers.get('x-user-name') || '',
    role: req.headers.get('x-user-role') || 'user',
    workspace: req.headers.get('x-workspace') || 'principal',
  };
}
