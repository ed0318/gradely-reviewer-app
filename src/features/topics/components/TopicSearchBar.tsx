import React, { useState } from 'react';
import { SearchField } from '@/components/SearchField';

/**
 * The search box over a topic's questions. It holds the text itself and reports
 * it, so typing re-draws only this box, not the list around it.
 */
export function TopicSearchBar({ questionCount, onChangeSearch }: { questionCount: number; onChangeSearch: (search: string) => void }) {
  const [text, setText] = useState('');
  return (
    <SearchField
      value={text}
      onChangeText={(next) => {
        setText(next);
        onChangeSearch(next);
      }}
      placeholder={questionCount > 0 ? `Search ${questionCount} ${questionCount === 1 ? 'question' : 'questions'}` : 'Search questions'}
    />
  );
}
