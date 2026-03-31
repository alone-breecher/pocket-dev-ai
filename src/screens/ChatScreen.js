import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../styles/colors';
import { useChat } from '../hooks/useChat';
import { useApp } from '../context/AppContext';
import { useSettings } from '../hooks/useSettings';
import MessageBubble from '../components/MessageBubble';
import ModelSelector from '../components/ModelSelector';
import HeaderBar from '../components/HeaderBar';
import EmptyChat from '../components/EmptyChat';
import fileService from '../services/FileService';

export default function ChatScreen({ navigation }) {
  const { sendMessage, stopStreaming, createSession, activeSession, isLoading } = useChat();
  const { state, dispatch } = useApp();
  const { serverOnline, checkServerStatus } = useSettings();

  const [inputText, setInputText] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [includeProject, setIncludeProject] = useState(false);
  const flatListRef = useRef(null);

  const messages = useMemo(() => activeSession?.messages || [], [activeSession]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');

    let projectContext = '';
    if (includeProject && state.projectFiles.length > 0) {
      projectContext = await fileService.buildProjectContext(state.projectFiles);
    }

    await sendMessage(text, projectContext);
  }, [inputText, isLoading, includeProject, state.projectFiles, sendMessage]);

  const handleNewChat = useCallback(() => {
    createSession();
  }, [createSession]);

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const renderMessage = useCallback(({ item, index }) => (
    <MessageBubble
      message={item}
      isLast={index === messages.length - 1}
    />
  ), [messages.length]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderBar
        title="PocketDevAI"
        subtitle={state.selectedModel}
        serverOnline={serverOnline}
        onCheckServer={checkServerStatus}
        rightActions={[
          {
            icon: 'add-circle-outline',
            onPress: handleNewChat,
            label: 'New chat',
          },
          {
            icon: 'settings-outline',
            onPress: () => navigation.navigate('Settings'),
            label: 'Settings',
          },
        ]}
      />

      {/* Model selector pill */}
      <TouchableOpacity
        style={styles.modelPill}
        onPress={() => setShowModelSelector(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="cube-outline" size={14} color={COLORS.accent} />
        <Text style={styles.modelPillText} numberOfLines={1}>
          {state.selectedModel}
        </Text>
        <Ionicons name="chevron-down" size={12} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Chat messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        ListEmptyComponent={<EmptyChat onSuggestionPress={setInputText} />}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      />

      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputContainer}>
          {/* Project attach toggle */}
          {state.projectFiles.length > 0 && (
            <TouchableOpacity
              style={[styles.projectToggle, includeProject && styles.projectToggleActive]}
              onPress={() => setIncludeProject(!includeProject)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={includeProject ? 'folder' : 'folder-outline'}
                size={14}
                color={includeProject ? COLORS.accent : COLORS.textMuted}
              />
              <Text style={[styles.projectToggleText, includeProject && styles.projectToggleTextActive]}>
                {state.projectName || 'Project'} ({state.projectFiles.length})
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your code..."
              placeholderTextColor={COLORS.textDim}
              multiline
              maxLength={4000}
              returnKeyType="default"
              blurOnSubmit={false}
              selectionColor={COLORS.accent}
            />

            {isLoading ? (
              <TouchableOpacity style={styles.stopButton} onPress={stopStreaming} activeOpacity={0.7}>
                <Ionicons name="stop" size={18} color={COLORS.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim()}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={18} color={inputText.trim() ? '#fff' : COLORS.textDim} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.charCount}>
            {inputText.length > 3000 ? `${4000 - inputText.length} remaining` : ''}
          </Text>
        </View>
      </KeyboardAvoidingView>

      {showModelSelector && (
        <ModelSelector
          visible={showModelSelector}
          onClose={() => setShowModelSelector(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 260,
  },
  modelPillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  messageList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
    flexGrow: 1,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
  },
  projectToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  projectToggleActive: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accentDim,
  },
  projectToggleText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  projectToggleTextActive: {
    color: COLORS.accent,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 2,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceHigher,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.errorDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
    flexShrink: 0,
  },
  charCount: {
    color: COLORS.textDim,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 3,
    height: 14,
  },
});
