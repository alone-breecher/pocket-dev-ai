import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../styles/colors';

export default function HeaderBar({ title, subtitle, serverOnline, onCheckServer, rightActions = [] }) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>

      <View style={styles.right}>
        {/* Server status dot */}
        {onCheckServer && (
          <TouchableOpacity style={styles.serverBtn} onPress={onCheckServer} activeOpacity={0.7}>
            <View style={[
              styles.statusDot,
              serverOnline === true && styles.dotOnline,
              serverOnline === false && styles.dotOffline,
              serverOnline === null && styles.dotUnknown,
            ]} />
          </TouchableOpacity>
        )}

        {rightActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionBtn}
            onPress={action.onPress}
            activeOpacity={0.7}
            accessibilityLabel={action.label}
          >
            <Ionicons name={action.icon} size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  left: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: COLORS.textDim,
    fontSize: 11,
    fontFamily: 'Courier New',
    maxWidth: 200,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serverBtn: {
    padding: 8,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  dotOnline: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  dotOffline: {
    backgroundColor: COLORS.error,
  },
  dotUnknown: {
    backgroundColor: COLORS.textDim,
  },
  actionBtn: {
    padding: 8,
    borderRadius: RADIUS.md,
  },
});
