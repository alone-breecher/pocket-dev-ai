import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../styles/colors';
import { useChat } from '../hooks/useChat';
import { useNavigation } from '@react-navigation/native';

export default function HistoryScreen() {
  const { sessions, activeSession, switchSession, deleteSession, createSession } = useChat();
  const navigation = useNavigation();

  const handleSelectSession = useCallback((sessionId) => {
    switchSession(sessionId);
    navigation.navigate('Chat');
  }, [switchSession, navigation]);

  const handleDeleteSession = useCallback((session) => {
    Alert.alert(
      'Delete Chat',
      `Delete "${session.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession(session.id),
        },
      ]
    );
  }, [deleteSession]);

  const handleNewChat = useCallback(() => {
    createSession();
    navigation.navigate('Chat');
  }, [createSession, navigation]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderSession = useCallback(({ item }) => {
    const isActive = item.id === activeSession?.id;
    const lastMessage = item.messages[item.messages.length - 1];

    return (
      <TouchableOpacity
        style={[styles.sessionCard, isActive && styles.sessionCardActive]}
        onPress={() => handleSelectSession(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionIcon}>
          <Ionicons
            name={isActive ? 'chatbubbles' : 'chatbubbles-outline'}
            size={18}
            color={isActive ? COLORS.accent : COLORS.textMuted}
          />
        </View>

        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionTitle, isActive && styles.sessionTitleActive]} numberOfLines={1}>
            {item.title || 'New Chat'}
          </Text>
          {lastMessage && (
            <Text style={styles.sessionPreview} numberOfLines={1}>
              {lastMessage.role === 'user' ? '👤 ' : '🤖 '}
              {lastMessage.content}
            </Text>
          )}
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionTime}>{formatTime(item.updatedAt)}</Text>
            <Text style={styles.sessionCount}>{item.messages.length} msgs</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteSession(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.textDim} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [activeSession?.id, handleSelectSession, handleDeleteSession]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat History</Text>
        <TouchableOpacity style={styles.newChatBtn} onPress={handleNewChat} activeOpacity={0.7}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newChatText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textDim} />
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptyText}>Start a conversation from the Chat tab</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  newChatText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  list: {
    padding: SPACING.md,
    gap: SPACING.sm,
    flexGrow: 1,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  sessionCardActive: {
    borderColor: COLORS.accentDim,
    backgroundColor: COLORS.card,
  },
  sessionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sessionInfo: {
    flex: 1,
    gap: 3,
  },
  sessionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sessionTitleActive: {
    color: COLORS.accentLight,
  },
  sessionPreview: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  sessionTime: {
    color: COLORS.textDim,
    fontSize: 11,
  },
  sessionCount: {
    color: COLORS.textDim,
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
    flexShrink: 0,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingTop: 80,
  },
  emptyTitle: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: 14,
    textAlign: 'center',
  },
});
