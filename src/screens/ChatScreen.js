// ... existing imports ...
import SkillsService from '../services/SkillsService';
// ... rest of imports ...

export default function ChatScreen({ navigation }) {
  const { 
    sendMessage, 
    stopStreaming, 
    createSession, 
    activeSession, 
    isLoading,
    detectSkill,
    getSkillMetadata,
  } = useChat();
  const { state, dispatch } = useApp();
  const { serverOnline, checkServerStatus } = useSettings();

  const [inputText, setInputText] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [includeProject, setIncludeProject] = useState(false);
  const [detectedSkill, setDetectedSkill] = useState(null); // NEW: skill hint
  const flatListRef = useRef(null);

  const messages = useMemo(() => activeSession?.messages || [], [activeSession]);

  // NEW: Update skill detection as user types (for UI hints)
  useEffect(() => {
    const skill = detectSkill(inputText);
    setDetectedSkill(skill);
  }, [inputText, detectSkill]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    setDetectedSkill(null); // Clear hint after send

    let projectContext = '';
    if (includeProject && state.projectFiles.length > 0) {
      projectContext = await fileService.buildProjectContext(state.projectFiles);
    }

    await sendMessage(text, projectContext);
  }, [inputText, isLoading, includeProject, state.projectFiles, sendMessage]);

  // ... existing handlers ...

  // PERFORMANCE: Optimized FlatList config for low-end devices
  const flatListConfig = useMemo(() => ({
    removeClippedSubviews: true,
    maxToRenderPerBatch: 5, // Reduced from 10 for 2GB RAM devices
    windowSize: 7, // Reduced from 10
    initialNumToRender: 10, // Reduced from 15
    updateCellsBatchingPeriod: 100, // Increased for less frequent updates
    maintainVisibleContentPosition: { minIndexForVisible: 0 },
    // NEW: Lazy rendering optimization
    getItemLayout: (_data, index) => ({
      length: 80, // Approximate height per message
      offset: 80 * index,
      index,
    }),
  }), []);

  // PERFORMANCE: Memoized message renderer
  const renderMessage = useCallback(({ item }) => (
    <MessageBubble 
      message={item} 
      isOwn={item.role === 'user'}
      skill={item.skill} // NEW: Pass skill for styling
    />
  ), []);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* ... HeaderBar ... */}

      {/* Skill hint banner (NEW) */}
      {detectedSkill && !isLoading && (
        <View style={styles.skillHint}>
          <Ionicons 
            name={getSkillMetadata(detectedSkill)?.icon || 'sparkles'} 
            size={14} 
            color={getSkillMetadata(detectedSkill)?.color || '#8b85ff'} 
          />
          <Text style={styles.skillHintText}>
            {getSkillMetadata(detectedSkill)?.label} mode active
          </Text>
        </View>
      )}

      {/* Chat messages - OPTIMIZED */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        style={styles.messageList}
        {...flatListConfig} // Apply performance config
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={<EmptyChat onSuggestionPress={handleSend} />}
      />

      {/* Input area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ... project toggle ... */}
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about code, bugs, or architecture..."
            placeholderTextColor={COLORS.textDim}
            multiline
            maxLength={4000}
            // PERFORMANCE: Limit re-renders during typing
            blurOnSubmit={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          
          {isLoading ? (
            <TouchableOpacity 
              style={styles.stopButton} 
              onPress={stopStreaming}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="stop" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Character count */}
        {inputText.length > 3000 && (
          <Text style={styles.charCount}>
            {4000 - inputText.length} remaining
          </Text>
        )}
      </KeyboardAvoidingView>

      {/* Model selector modal */}
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
  // ... existing styles ...
  
  // NEW: Skill hint banner styles
  skillHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 133, 255, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(139, 133, 255, 0.3)',
  },
  skillHintText: {
    color: '#8b85ff',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // OPTIMIZED: Input styles for better performance
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 100, // Reduced from 120
    lineHeight: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 2,
    // PERFORMANCE: Reduce layout calculations
    textAlignVertical: 'top',
  },
  // ... rest of styles ...
});
