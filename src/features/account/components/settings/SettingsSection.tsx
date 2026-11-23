import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/Card';
import { Collapsible } from '@/components/Collapsible';
import { Divider } from '@/components/Divider';
import { Icon, type IconName } from '@/components/Icon';
import { color } from '@/theme/theme';
import { SettingsRows, type SettingRow } from './SettingsRows';

/** One folded group, as in gradely-app: its name and a summary line, the rows once tapped. */
export function SettingsSection({ icon, title, summary, rows }: { icon: IconName; title: string; summary: string; rows: SettingRow[] }) {
  return (
    <Card style={styles.card}>
      <Collapsible
        minHeight={60}
        leading={
          <View style={styles.icon}>
            <Icon name={icon} size={18} color={color.primary} />
          </View>
        }
        title={title}
        subtitle={summary}
      >
        <Divider />
        <SettingsRows rows={rows} />
      </Collapsible>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  icon: { width: 32, height: 32, borderRadius: 8, backgroundColor: color.primaryTint, alignItems: 'center', justifyContent: 'center' },
});
