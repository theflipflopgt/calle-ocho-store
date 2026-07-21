import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server-auth';
import {
  DEFAULT_HOME_CONTENT,
  type HomeContent,
} from '@/lib/home-content-defaults';

function mergeHomeContent(content: Partial<HomeContent> | null | undefined): HomeContent {
  const incomingHero: Partial<HomeContent['hero']> = content?.hero || {};

  return {
    hero: {
      ...DEFAULT_HOME_CONTENT.hero,
      ...incomingHero,
      mode: incomingHero.mode === 'slider' ? 'slider' : 'video',
      slides:
        Array.isArray(incomingHero.slides) && incomingHero.slides.length > 0
          ? incomingHero.slides.map((slide, index) => ({
              ...DEFAULT_HOME_CONTENT.hero.slides[index % DEFAULT_HOME_CONTENT.hero.slides.length],
              ...slide,
            }))
          : DEFAULT_HOME_CONTENT.hero.slides,
    },
    categories:
      Array.isArray(content?.categories) && content.categories.length > 0
        ? content.categories.map((category, index) => ({
            ...DEFAULT_HOME_CONTENT.categories[index % DEFAULT_HOME_CONTENT.categories.length],
            ...category,
          }))
        : DEFAULT_HOME_CONTENT.categories,
  };
}

function missingTableResponse() {
  return NextResponse.json(
    {
      error:
        'Falta aplicar la migración de Supabase para crear la tabla site_content. Aplica supabase/migrations/20260721002000_site_content.sql y vuelve a guardar.',
      missingTable: true,
    },
    { status: 424 }
  );
}

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });

  const db = auth.supabase as any;
  const { data, error } = await db
    .from('site_content')
    .select('content')
    .eq('key', 'home')
    .maybeSingle();

  if (error?.message?.includes("Could not find the table 'public.site_content'")) {
    return missingTableResponse();
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ content: mergeHomeContent(data?.content) });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });

  let body: { content?: HomeContent };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  if (!body.content?.hero || !Array.isArray(body.content.categories)) {
    return NextResponse.json({ error: 'Contenido de inicio inválido.' }, { status: 400 });
  }

  const db = auth.supabase as any;
  const { error } = await db.from('site_content').upsert({
    key: 'home',
    content: body.content,
    updated_at: new Date().toISOString(),
  });

  if (error?.message?.includes("Could not find the table 'public.site_content'")) {
    return missingTableResponse();
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, content: body.content });
}
