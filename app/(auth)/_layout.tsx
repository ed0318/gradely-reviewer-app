import { Stack } from 'expo-router';
import { color } from '@/theme/theme';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }} />;
}
