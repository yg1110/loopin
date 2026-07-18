import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color="#d1d5db" />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#374151' },
  subtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
