import { createClient } from '@/lib/supabase/server';
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
    footer: {
      ...DEFAULT_HOME_CONTENT.footer,
      ...(content?.footer || {}),
    },
  };
}

export async function getHomeContent(): Promise<HomeContent> {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('site_content')
      .select('content')
      .eq('key', 'home')
      .maybeSingle();

    if (error || !data?.content) {
      return DEFAULT_HOME_CONTENT;
    }

    return mergeHomeContent(data.content as Partial<HomeContent>);
  } catch {
    return DEFAULT_HOME_CONTENT;
  }
}
