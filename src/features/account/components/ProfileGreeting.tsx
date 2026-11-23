import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { buildFullName, buildGreeting } from '@/lib/personName';
import { IOS, IOS_DIM } from '@/theme/press';
import { color, font } from '@/theme/theme';

type ProfileGreetingProps = { firstName: string; lastName: string; photoUri: string | null; onPress: () => void };

/** Avatar, "Good evening," and the full name; the whole row opens Settings. */
export function ProfileGreeting({ firstName, lastName, photoUri, onPress }: ProfileGreetingProps) {
  const fullName = buildFullName(firstName, lastName);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${fullName}, open settings`}
      style={({ pressed }) => [styles.root, IOS && pressed && IOS_DIM]}
    >
      <Avatar firstName={firstName} lastName={lastName} photoUri={photoUri} />
      <View style={styles.words}>
        <Text style={styles.greeting}>{buildGreeting(new Date())}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {fullName}
        </Text>
      </View>
      <Icon name="settings" color={color.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  words: { flex: 1, gap: 1 },
  greeting: { fontFamily: font.uiRegular, fontSize: 13, color: color.inkMuted },
  name: { fontFamily: font.title, fontSize: 22, lineHeight: 24, color: color.ink },
});
