import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BibleBook {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
}

interface BibleChapter {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
}

interface BibleVerse {
  id: string;
  orgId: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
}

interface ChapterContent {
  id: string;
  reference: string;
  content: string;
}

async function fetchBibleData(endpoint: string, params?: Record<string, string>) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = new URL(`https://${projectId}.supabase.co/functions/v1/bible-api`);
  url.searchParams.set("endpoint", endpoint);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Bible API error: ${response.status}`);
  }

  const json = await response.json();
  return json.data;
}

export function useBibleBooks() {
  return useQuery<BibleBook[]>({
    queryKey: ["bible", "books"],
    queryFn: async () => {
      const data = await fetchBibleData("books");
      return data;
    },
    staleTime: Infinity,
  });
}

export function useBibleChapters(bookId: string | null) {
  return useQuery<BibleChapter[]>({
    queryKey: ["bible", "chapters", bookId],
    queryFn: async () => {
      const data = await fetchBibleData(`books/${bookId}/chapters`);
      return data;
    },
    enabled: !!bookId,
    staleTime: Infinity,
  });
}

export function useChapterContent(chapterId: string | null) {
  return useQuery<ChapterContent>({
    queryKey: ["bible", "content", chapterId],
    queryFn: async () => {
      const data = await fetchBibleData(`chapters/${chapterId}`, {
        "content-type": "html",
        "include-notes": "false",
        "include-titles": "true",
        "include-chapter-numbers": "false",
        "include-verse-numbers": "true",
        "include-verse-spans": "false",
      });
      return data;
    },
    enabled: !!chapterId,
    staleTime: 60 * 60 * 1000, // 1h — chapters are cached server-side too
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
}
