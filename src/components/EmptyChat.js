import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../styles/colors';

const SUGGESTIONS = [
  { icon: 'bug-outline', label: 'Debug code', prompt: 'Help me debug this error: ' },
  { icon: 'shield-checkmark-outline', label: 'Code review', prompt: 'Please review this code and suggest improvements:\n\n' },
  { icon: 'flash-outline', label: 'Optimize', prompt: 'Optimize this function for performance:\n\n' },
  { icon: 'document-text-outline', label: 'Add docs', prompt: 'Write documentation and comments for this code:\n\n' },
  { icon: 'construct-outline', label: 'Refactor', prompt: 'Refactor this code to be cleaner and more maintainable:\n\n' },
  { icon: 'layers-outline', label: 'Explain code', prompt: 'Explain what this code does step by step:\n\n' },
];

export default function EmptyChat({ onSuggestionPress }) {
  return (
    <View style={styles.container}>
      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoRing}>
          <View style={styles.logoInner}>
            <Ionicons name="code-slash" size={28} color={COLORS.accent} />
          </View>
        </View>
        <Text style={styles.title}>PocketDevAI</Text>
        <Text style={styles.subtitle}>
          Your AI coding assistant.{'\n'}Ask anything about your code.
        </Text>
      </View>

      {/* Suggestions */}
      <Text style={styles.suggestionsLabel}>Try asking...</Text>
      <View style={styles.suggestionsGrid}>
        {SUGGESTIONS.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={styles.suggestionCard}
            onPress={() => onSuggestionPress(s.prompt)}
            activeOpacity={0.7}
          >
            <Ionicons name={s.icon} size={18} color={COLORS.accent} />
            <Text style={styles.suggestionText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>
        💡 Upload project files in the Project tab to give AI context about your codebase
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  logoArea: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentGlow,
  },
  logoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestionsLabel: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  hint: {
    color: COLORS.textDim,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'stretch',
  },
});
