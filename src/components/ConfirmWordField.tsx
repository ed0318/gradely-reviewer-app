import React from 'react';
import { TextField } from '@/components/TextField';

type ConfirmWordFieldProps = {
  word: 'CONFIRM' | 'DELETE';
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  isEditable?: boolean;
};

/** "Type DELETE to confirm": the guard in front of anything that erases. */
export function ConfirmWordField({ word, value, onChangeText, label = `Type ${word} to confirm`, isEditable = true }: ConfirmWordFieldProps) {
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={word}
      autoCapitalize="characters"
      autoCorrect={false}
      autoComplete="off"
      spellCheck={false}
      editable={isEditable}
      isMonospace
    />
  );
}

export function isConfirmWordTyped(word: string, typed: string): boolean {
  return typed.trim().toUpperCase() === word;
}
