import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../styles/colors';
import { useApp } from '../context/AppContext';
import { useSettings } from '../hooks/useSettings';

const TAG_COLORS = {
  CODING: { bg: 'rgba(108, 99, 255, 0.15)', text: '#8b85ff' },
  META: { bg: 'rgba(0, 173, 216, 0.15)', text: '#00add8' },
  GOOGLE: { bg: 'rgba(66, 133, 244, 0.15)', text: '#4285f4' },
  MISTRAL: { bg: 'rgba(255, 107, 53, 0.15)', text: '#ff6b35' },
  QWEN: { bg: 'rgba(0, 212, 170, 0.15)', text: '#00d4aa' },
  CHAT: { bg: 'rgba(136, 136, 160, 0.15)', text: '#8888a0' },
};

export default function ModelSelector({ visible, onClose }) {
  const { state, dispatch } = useApp();
  const { checkServerStatus, serverOnline } = useSettings();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleSelect = useCallback((modelId) => {
    dispatch({ type: 'SET_MODEL', payload: modelId });
    onClose();
  }, [dispatch, onClose]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkServerStatus();
    setRefreshing(false);
  }, [checkServerStatus]);

  const renderModel = useCallback(({ item }) => {
    const isSelected = item.id === state.selectedModel;
    const tagStyle = TAG_COLORS[item.tag] || TAG_COLORS.CHAT;

    return (
      <TouchableOpacity
        style={[styles.modelItem, isSelected && styles.modelItemSelected]}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.modelLeft}>
          <View style={[styles.modelTag, { backgroundColor: tagStyle.bg }]}>
            <Text style={[styles.modelTagText, { color: tagStyle.text }]}>{item.tag}</Text>
          </View>
          <View style={styles.modelInfo}>
            <Text style={[styles.modelName, isSelected && styles.modelNameSelected]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.size && (
              <Text style={styles.modelSize}>{formatBytes(item.size)}</Text>
            )}
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
        )}
      </TouchableOpacity>
    );
  }, [state.selectedModel, handleSelect]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Select Model</Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing
                ? <ActivityIndicator size={16} color={COLORS.accent} />
                : <Ionicons name="refresh" size={18} color={COLORS.textMuted} />
              }
            </TouchableOpacity>
          </View>

          {/* Server status */}
          <View style={[styles.statusRow, serverOnline ? styles.statusRowOnline : styles.statusRowOffline]}>
            <View style={[styles.dot, serverOnline ? styles.dotOn : styles.dotOff]} />
            <Text style={[styles.statusText, serverOnline ? styles.statusOn : styles.statusOff]}>
              {serverOnline === null
                ? 'Tap refresh to check server'
                : serverOnline
                ? 'Server connected — showing available models'
                : 'Server offline — showing default models'}
            </Text>
          </View>

          <FlatList
            data={state.availableModels}
            renderItem={renderModel}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No models found. Check server connection.</Text>
              </View>
            }
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '';
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  refreshBtn: {
    padding: 6,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusRowOnline: { backgroundColor: 'rgba(0,212,170,0.08)' },
  statusRowOffline: { backgroundColor: 'rgba(136,136,160,0.08)' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotOn: { backgroundColor: COLORS.success },
  dotOff: { backgroundColor: COLORS.textDim },
  statusText: { fontSize: 12, flex: 1 },
  statusOn: { color: COLORS.success },
  statusOff: { color: COLORS.textDim },
  list: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modelItemSelected: {
    borderColor: COLORS.accentDim,
    backgroundColor: COLORS.accentGlow,
  },
  modelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  modelTag: {
    borderRadius: RADIUS.sm,
    paddingVertical: 3,
    paddingHorizontal: 7,
    flexShrink: 0,
  },
  modelTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modelInfo: {
    flex: 1,
    gap: 2,
  },
  modelName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modelNameSelected: {
    color: COLORS.accentLight,
  },
  modelSize: {
    color: COLORS.textDim,
    fontSize: 11,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  closeBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
