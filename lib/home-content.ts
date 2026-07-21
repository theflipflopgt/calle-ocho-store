import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_HOME_CONTENT,
  type HomeContent,
} from '@/lib/home-content-defaults';

function mergeHomeContent(content: Partial<HomeContent> | null | undefined): HomeContent {
  return {
    hero: {
      ...DEFAULT_HOME_CONTENT.hero,
      ...(content?.hero || {}),
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
