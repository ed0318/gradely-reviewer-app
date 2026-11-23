import React from 'react';
import { Divider } from '@/components/Divider';
import { Icon, type IconName } from '@/components/Icon';
import { Row } from '@/components/Row';
import { color } from '@/theme/theme';

export type SettingRow = { icon: IconName; label: string; hint?: string; value?: string; valueColor?: string; trailing?: React.ReactNode; onPress?: () => void };

/** gradely-app's settings rows: icon, label, value and chevron, ruled apart. */
export function SettingsRows({ rows }: { rows: SettingRow[] }) {
  return (
    <>
      {rows.map((row, index) => (
        <React.Fragment key={row.label}>
          {index > 0 && <Divider inset={49} />}
          <Row
            minHeight={52}
            leading={<Icon name={row.icon} size={19} color={color.inkMuted} />}
            title={row.label}
            subtitle={row.hint}
            trailingText={row.value}
            trailingTextColor={row.valueColor ?? color.inkMuted}
            trailing={row.trailing}
            showChevron={!!row.onPress && !row.trailing}
            onPress={row.onPress}
          />
        </React.Fragment>
      ))}
    </>
  );
}
