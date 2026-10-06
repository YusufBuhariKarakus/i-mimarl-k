import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, space } from '../lib/theme';

interface Props {
  label: string;
  selected: boolean;
  locked?: boolean;
  onPress(): void;
}

export function Chip({ label, selected, locked, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {locked ? '🔒 ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { color: colors.text, fontSize: 14 },
  selectedLabel: { color: '#FFFFFF', fontWeight: '600' },
});
