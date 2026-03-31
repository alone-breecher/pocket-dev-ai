// ... existing imports ...
import ModelRouter from '../services/ModelRouter';
import { VALID_CLOUD_MODELS } from '../services/OllamaService';

// Add AUTO option to models list
const AUTO_MODEL_OPTION = {
  id: 'auto',
  name: '🤖 Auto-select (Smart Routing)',
  tag: 'AUTO',
  description: 'AI picks best model for your query',
};

export default function ModelSelector({ visible, onClose }) {
  const { state, dispatch } = useApp();
  const { checkServerStatus, serverOnline } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const [models, setModels] = useState([]);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const fetched = await ollamaService.getModels();
      // Filter to valid cloud models + add auto option
      const validModels = fetched.filter(m => 
        Object.values(VALID_CLOUD_MODELS).includes(m.id)
      );
      setModels([AUTO_MODEL_OPTION, ...validModels]);
    } catch {
      // Fallback to predefined valid models
      setModels([
        AUTO_MODEL_OPTION,
        { id: VALID_CLOUD_MODELS.LLAMA3, name: 'Llama 3', tag: 'META' },
        { id: VALID_CLOUD_MODELS.QWEN_CODER, name: 'Qwen 2.5 Coder', tag: 'CODING' },
        { id: VALID_CLOUD_MODELS.DEEPSEEK_CODER, name: 'DeepSeek Coder', tag: 'CODING' },
      ]);
    }
  };

  const handleSelect = useCallback((modelId) => {
    dispatch({ type: 'SET_MODEL', payload: modelId });
    onClose();
  }, [dispatch, onClose]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkServerStatus();
    await loadModels();
    setRefreshing(false);
  }, [checkServerStatus]);

  const renderModel = useCallback(({ item }) => {
    const isSelected = item.id === state.selectedModel;
    const isAuto = item.id === 'auto';
    const tagStyle = isAuto 
      ? { bg: 'rgba(139, 133, 255, 0.2)', text: '#a5a0ff' }
      : (TAG_COLORS[item.tag] || TAG_COLORS.CHAT);

    return (
      <TouchableOpacity
        style={[styles.modelItem, isSelected && styles.modelItemSelected]}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.modelLeft}>
          <View style={[styles.modelTag, { backgroundColor: tagStyle.bg }]}>
            <Text style={[styles.modelTagText, { color: tagStyle.text }]}>
              {isAuto ? '🤖' : item.tag}
            </Text>
          </View>
          <View style={styles.modelInfo}>
            <Text style={[
              styles.modelName,
              isSelected && styles.modelNameSelected,
              isAuto && { fontWeight: '700' }
            ]}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={styles.modelSize}>{item.description}</Text>
            )}
            {item.size && !isAuto && (
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* ... existing modal structure ... */}
      
      {/* Server status + Auto mode info */}
      <View style={[
        styles.statusRow,
        serverOnline ? styles.statusRowOnline : styles.statusRowOffline
      ]}>
        <View style={[styles.dot, serverOnline ? styles.dotOn : styles.dotOff]} />
        <Text style={[styles.statusText, serverOnline ? styles.statusOn : styles.statusOff]}>
          {serverOnline === null
            ? 'Tap refresh to check server'
            : serverOnline
            ? 'Auto mode: AI selects best model per query'
            : 'Offline: Using local fallback models'}
        </Text>
      </View>

      <FlatList
        data={models}
        keyExtractor={item => item.id}
        renderItem={renderModel}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No models available</Text>
          </View>
        }
      />

      {/* ... close button ... */}
    </Modal>
  );
}

// ... existing helper functions and styles ...
