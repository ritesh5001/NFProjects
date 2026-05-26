import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task } from '../types';
import { useTheme, AppTheme } from '../theme/theme';

interface Props {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => onToggle(task.id, !task.is_completed)} style={styles.checkbox}>
        <MaterialCommunityIcons
          name={task.is_completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
          size={22}
          color={task.is_completed ? theme.colors.primary : theme.colors.textSubtle}
        />
      </TouchableOpacity>
      <Text style={[styles.title, task.is_completed && styles.done]} numberOfLines={2}>
        {task.title}
      </Text>
      <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.del}>
        <MaterialCommunityIcons name="close" size={18} color={theme.colors.textSubtle} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  checkbox: { padding: 2 },
  title: { flex: 1, fontSize: 14, color: theme.colors.text },
  done: { color: theme.colors.textSubtle, textDecorationLine: 'line-through' },
  del: { padding: 4 },
});
