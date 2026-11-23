import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { color, font, radius } from '@/theme/theme';
import { Icon } from './Icon';

export type ComboOption = {
  id: string;
  label: string;
  /** Secondary line under the label — what the option means. */
  blurb?: string;
  /** Right-hand hint, e.g. what this option renders a sample value as. */
  sample?: string;
  /** Extra words the search should match on, beyond label and blurb. */
  keywords?: string;
  /** A heading the option sits under; each new one starts a group. Options with none come first. */
  section?: string;
};

/**
 * The tallest the picker gets. A ceiling rather than a height: a list of three
 * options is three options tall, and only a list long enough to need it gets
 * the scroll.
 */
const PANEL_MAX_HEIGHT = 420;
/** Room the panel leaves for the window's own edges — and for the keyboard. */
const PANEL_INSET = 120;
const PANEL_MAX_WIDTH = 520;

/**
 * A field that opens a searchable list for picking one of a set that is too
 * long to sit inline as rows, but too short to deserve its own screen.
 *
 * The list is a centred dialog rather than a popup anchored under the field:
 * anchoring put it wherever the field happened to be — half off the bottom of
 * a scrolled form, and flipped above on one screen and below on the next. From
 * the middle, every picker in the app opens in the same place.
 *
 * It is as tall as what it holds, up to a ceiling, past which the list scrolls
 * inside it. A fixed height was the earlier answer and it made a picker of four
 * options half a screen of empty paper.
 */
export function ComboBox({
  label,
  value,
  options,
  onChange,
  onCreate,
  createLabel,
  placeholder = 'Select one',
  searchPlaceholder = 'Search',
  emptyText = 'Nothing matches that.',
  noneText,
  search,
  disabled,
  action,
  style,
}: {
  label?: string;
  value: string;
  options: ComboOption[];
  onChange: (id: string) => void;
  /** Lets the teacher make what they typed when the list has nothing like it. */
  onCreate?: (text: string) => void;
  createLabel?: (text: string) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Shown instead of `emptyText` while nothing is typed: the list itself is empty, nothing has failed to match. */
  noneText?: string;
  /**
   * The list's own search, for a set too long to list before anything is
   * typed. When given, the panel shows only what it returns, and `options`
   * only has to hold the current selection — for the field's label.
   */
  search?: (query: string) => ComboOption[];
  /**
   * Shows the selection but never opens the list — a field on work an expired
   * plan has frozen. Dimmed rather than hidden, because what was picked is
   * still part of what the teacher is reading.
   */
  disabled?: boolean;
  /** A standing action pinned under the list, such as making a new one of the thing picked. */
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // The pinned action runs once the panel has closed, not in the same tap. An
  // action that navigates would otherwise freeze this screen (`freezeOnBlur`)
  // before the close renders, and the panel's native modal would stay up over
  // the next screen, empty and invisible, swallowing every tap on it.
  const pendingAction = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (open || !pendingAction.current) return;
    const run = pendingAction.current;
    pendingAction.current = null;
    run();
  }, [open]);
  const { height } = useWindowDimensions();

  const selected = options.find((o) => o.id === value) ?? null;

  const matches = useMemo(() => {
    if (search) return search(query);
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.blurb ?? ''} ${o.keywords ?? ''}`.toLowerCase().includes(q));
  }, [options, query, search]);

  const openPanel = () => {
    setQuery('');
    setOpen(true);
  };

  // Only offer to create something the list does not already hold.
  const typed = query.trim();
  const canCreate =
    !!onCreate && typed.length > 0 && !options.some((o) => o.label.toLowerCase() === typed.toLowerCase());

  // The one thing the window gets a say in: on a short screen the ceiling comes
  // down with it, rather than letting a long list run off both ends.
  const panelMaxHeight = Math.min(PANEL_MAX_HEIGHT, height - PANEL_INSET);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={openPanel}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        accessibilityLabel={`${label ?? 'Selection'}: ${selected?.label ?? placeholder}`}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.triggerLabel, !selected && styles.triggerPlaceholder]} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          {selected?.blurb ? (
            <Text style={styles.triggerBlurb} numberOfLines={1}>
              {selected.blurb}
            </Text>
          ) : null}
        </View>
        {selected?.sample ? <Text style={styles.triggerSample}>{selected.sample}</Text> : null}
        <Icon name="expandMore" size={18} color={color.chevron} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable accessible={false} style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable accessible={false} onPress={(e) => e.stopPropagation()} style={[styles.panel, { maxHeight: panelMaxHeight }]}>
              {/* Away from the field it belongs to, the panel has to say what is
                  being picked. */}
              {label ? (
                <View style={styles.head}>
                  <Text style={styles.headTitle} numberOfLines={1}>
                    {label}
                  </Text>
                  <Pressable hitSlop={10} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Close">
                    <Icon name="close" size={17} color={color.inkMuted} />
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.search}>
                <Icon name="search" size={16} color={color.inkMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={color.inkMuted}
                  style={styles.searchInput}
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {query.length > 0 && (
                  <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}>
                    <Icon name="close" size={15} color={color.inkMuted} />
                  </Pressable>
                )}
              </View>
              <View style={styles.rule} />

              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {matches.length === 0 ? (
                  <Text style={styles.empty}>{!query.trim() && noneText ? noneText : emptyText}</Text>
                ) : (
                  matches.map((o, i) => {
                    const on = o.id === value;
                    const heading = o.section && o.section !== matches[i - 1]?.section ? o.section : null;
                    return (
                      <React.Fragment key={o.id}>
                        {heading ? <Text style={styles.section}>{heading.toUpperCase()}</Text> : null}
                        <Pressable
                          style={[styles.option, on && styles.optionOn]}
                          onPress={() => {
                            onChange(o.id);
                            setOpen(false);
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                        >
                          <View style={styles.tick}>{on && <Icon name="check" size={15} color={color.primary} />}</View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.optionLabel} numberOfLines={1}>
                              {o.label}
                            </Text>
                            {o.blurb ? (
                              <Text style={styles.optionBlurb} numberOfLines={1}>
                                {o.blurb}
                              </Text>
                            ) : null}
                          </View>
                          {o.sample ? <Text style={styles.optionSample}>{o.sample}</Text> : null}
                        </Pressable>
                      </React.Fragment>
                    );
                  })
                )}
              </ScrollView>

              {/* Pinned under the list rather than being its last row: once the
                  list is long enough to scroll, anything at the end of it is a
                  scroll away. */}
              {canCreate && (
                <Pressable
                  style={styles.create}
                  onPress={() => {
                    onCreate!(typed);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                >
                  <Icon name="add" size={16} color={color.primary} />
                  <Text style={styles.createLabel} numberOfLines={1}>
                    {createLabel ? createLabel(typed) : `Add “${typed}”`}
                  </Text>
                </Pressable>
              )}
              {action && !canCreate && (
                <Pressable
                  style={styles.create}
                  onPress={() => {
                    pendingAction.current = action.onPress;
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                >
                  <Icon name="add" size={16} color={color.primary} />
                  <Text style={styles.createLabel} numberOfLines={1}>
                    {action.label}
                  </Text>
                </Pressable>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted, marginBottom: 8 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.surface, borderWidth: 1, borderColor: color.fieldBorder,
    borderRadius: radius.field,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 54,
  },
  triggerDisabled: { backgroundColor: color.rule },
  triggerLabel: { fontFamily: font.rowTitle, fontSize: 14.5, color: color.ink },
  triggerPlaceholder: { color: color.inkMuted },
  triggerBlurb: { fontFamily: font.rowSubtitle, fontSize: 11.5, color: color.inkMuted, marginTop: 2 },
  triggerSample: { fontFamily: font.mono, fontSize: 12.5, color: color.inkMuted },

  backdrop: { flex: 1, backgroundColor: 'rgba(23, 34, 51,.42)', justifyContent: 'center', paddingHorizontal: 22 },
  panel: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: PANEL_MAX_WIDTH,
    backgroundColor: color.sheet,
    borderRadius: radius.sheet,
    overflow: 'hidden',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4 },
  headTitle: { flex: 1, fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 48 },
  searchInput: { flex: 1, fontFamily: font.uiRegular, fontSize: 14, color: color.ink, padding: 0 },
  rule: { height: 1, backgroundColor: color.overlayDivider },
  // Not `flex: 1`: in a box with a ceiling and no set height that resolves to
  // zero. Shrink-only means the list is as tall as its rows until the panel
  // runs out of room, and takes whatever is left after that.
  list: { flexShrink: 1 },
  // More at the foot than the head: the search rule above sets the list off on
  // its own, while below it there is only the panel's edge, and a last row
  // against it reads as a list that has been cut off rather than ended.
  listContent: { paddingTop: 4, paddingBottom: 20 },
  empty: { fontFamily: font.uiRegular, fontSize: 12.5, color: color.inkMuted, padding: 16 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 9, minHeight: 50 },
  optionOn: { backgroundColor: color.primaryTint },
  tick: { width: 18, alignItems: 'center' },
  optionLabel: { fontFamily: font.rowTitle, fontSize: 14, color: color.ink },
  optionBlurb: { fontFamily: font.rowSubtitle, fontSize: 11.5, color: color.inkMuted, marginTop: 2 },
  optionSample: { fontFamily: font.mono, fontSize: 12, color: color.inkMuted },
  create: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, minHeight: 52, borderTopWidth: 1, borderTopColor: color.overlayDivider },
  createLabel: { flex: 1, fontFamily: font.ui, fontSize: 13.5, color: color.primary },
  section: { fontFamily: font.eyebrow, fontSize: 10.5, letterSpacing: 1.1, color: color.inkMuted, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
});
