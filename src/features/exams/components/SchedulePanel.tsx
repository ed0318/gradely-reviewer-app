import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DateTimeButton } from '@/components/DateTimeButton';
import { Icon } from '@/components/Icon';
import { InlineDateTimePicker } from '@/components/InlineDateTimePicker';
import { color, font, radius } from '@/theme/theme';
import type { ExamForm } from '../hooks/useExamForm';
import type { useReminderPermission } from '../hooks/useReminderPermission';

type OpenField = 'date' | 'time' | null;

function formatWhen(when: number): string {
  const date = new Date(when);
  return `${date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

/** Date, time and "minutes before" for the reminder, and one line saying exactly when it will ring. */
export function SchedulePanel({ form, permission }: { form: ExamForm; permission: ReturnType<typeof useReminderPermission> }) {
  const [openField, setOpenField] = useState<OpenField>(null);
  const toggle = (field: Exclude<OpenField, null>) => setOpenField((current) => (current === field ? null : field));
  const isBlocked = permission.permission !== null && !permission.permission.isGranted && !permission.permission.canAsk;

  let remindLine = 'No reminder. Enter minutes to get one.';
  if (form.remindMinutes !== null && form.scheduledAt !== null) {
    remindLine =
      form.reminderAt === null
        ? 'That reminder time has already passed.'
        : form.remindMinutes === 0
          ? `Reminder when it starts, ${formatWhen(form.scheduledAt)}`
          : `Reminder ${formatWhen(form.reminderAt)}`;
  }

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <DateTimeButton label="DATE" text={form.day.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} icon="event" isOpen={openField === 'date'} onPress={() => toggle('date')} />
        <DateTimeButton label="TIME" text={form.clockTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} icon="clock" isOpen={openField === 'time'} onPress={() => toggle('time')} />
        <View style={styles.remind}>
          <Text style={styles.label}>REMIND</Text>
          <View style={styles.remindBox}>
            <TextInput
              value={form.remindText}
              onChangeText={form.changeRemindText}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={4}
              accessibilityLabel="Minutes before the exam to remind you"
              style={styles.remindInput}
            />
            <Text style={styles.min}>min</Text>
          </View>
        </View>
      </View>
      {openField === 'date' && <InlineDateTimePicker mode="date" value={form.day} onChange={form.setDay} onClose={() => setOpenField(null)} minimumDate={new Date()} />}
      {openField === 'time' && <InlineDateTimePicker mode="time" value={form.clockTime} onChange={form.setClockTime} onClose={() => setOpenField(null)} />}
      <View style={styles.note}>
        <Icon name="bell" size={14} color={color.inkMuted} />
        <Text style={styles.noteText}>{remindLine}</Text>
      </View>
      {isBlocked && (
        <Pressable onPress={permission.openPhoneSettings} style={styles.blocked} accessibilityRole="button" accessibilityLabel="Notifications are off for this app. Open phone settings">
          <Text style={styles.blockedText}>Notifications are off for this app, so no reminder will ring. Open settings</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8, padding: 12, backgroundColor: color.paper },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  remind: { flex: 0.9, minWidth: 0 },
  label: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 0.5, color: color.inkMuted, marginBottom: 4 },
  remindBox: { flexDirection: 'row', alignItems: 'center', minHeight: 44, borderRadius: radius.field, borderWidth: 1, borderColor: color.fieldBorder, backgroundColor: color.surface, paddingRight: 8 },
  remindInput: { flex: 1, minWidth: 0, minHeight: 44, textAlign: 'center', fontFamily: font.monoStrong, fontSize: 15, color: color.ink, padding: 0 },
  min: { fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteText: { flex: 1, fontFamily: font.uiRegular, fontSize: 12, color: color.inkMuted },
  blocked: { minHeight: 44, justifyContent: 'center' },
  blockedText: { fontFamily: font.eyebrow, fontSize: 12.5, color: color.primary },
});
