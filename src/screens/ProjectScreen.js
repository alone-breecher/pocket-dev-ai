import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../styles/colors';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import fileService from '../services/FileService';

export default function ProjectScreen() {
  const { state, dispatch } = useApp();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handlePickFiles = useCallback(async () => {
    setLoading(true);
    try {
      const files = await fileService.pickMultipleFiles();
      if (files.length > 0) {
        dispatch({
          type: 'SET_PROJECT_FILES',
          payload: {
            files,
            name: files.length === 1 ? files[0].name : `${files.length} files`,
          },
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const handleClearProject = useCallback(() => {
    Alert.alert('Clear Project', 'Remove all project files?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => dispatch({ type: 'CLEAR_PROJECT' }),
      },
    ]);
  }, [dispatch]);

  const handleAskAboutProject = useCallback(() => {
    navigation.navigate('Chat');
  }, [navigation]);

  const handleViewFile = useCallback(async (file) => {
    try {
      const content = await fileService.readFileContent(file.uri);
      Alert.alert(
        file.name,
        content.slice(0, 500) + (content.length > 500 ? '\n\n...(truncated)' : ''),
        [{ text: 'Close' }]
      );
    } catch {
      Alert.alert('Error', 'Could not read file content.');
    }
  }, []);

  const renderFile = useCallback(({ item }) => {
    const info = fileService.getFileInfo(item.name);
    return (
      <TouchableOpacity
        style={styles.fileCard}
        onPress={() => handleViewFile(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.fileIcon, { backgroundColor: `${info.color}20` }]}>
          <Ionicons name={info.icon} size={18} color={info.color} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.fileSize}>{fileService.formatSize(item.size)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textDim} />
      </TouchableOpacity>
    );
  }, [handleViewFile]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Project Files</Text>
        {state.projectFiles.length > 0 && (
          <TouchableOpacity onPress={handleClearProject} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Upload zone */}
      <View style={styles.uploadZone}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handlePickFiles}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.accent} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={28} color={COLORS.accent} />
              <Text style={styles.uploadTitle}>Upload Code Files</Text>
              <Text style={styles.uploadSubtitle}>
                Select .js, .py, .ts, .go, .rs and more{'\n'}Max 5MB per file
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {state.projectFiles.length > 0 ? (
        <>
          <View style={styles.projectInfo}>
            <View style={styles.projectInfoLeft}>
              <Ionicons name="folder" size={16} color={COLORS.teal} />
              <Text style={styles.projectInfoText}>
                {state.projectName} · {state.projectFiles.length} files
              </Text>
            </View>
            <TouchableOpacity
              style={styles.askButton}
              onPress={handleAskAboutProject}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#fff" />
              <Text style={styles.askButtonText}>Ask AI</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={state.projectFiles}
            renderItem={renderFile}
            keyExtractor={(item, i) => `${item.name}_${i}`}
            contentContainerStyle={styles.fileList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="code-slash-outline" size={56} color={COLORS.textDim} />
          <Text style={styles.emptyTitle}>No project loaded</Text>
          <Text style={styles.emptyText}>
            Upload your code files above, then ask the AI questions about them in the Chat tab.
          </Text>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Tips</Text>
            <Text style={styles.tipItem}>• Upload individual files or multiple at once</Text>
            <Text style={styles.tipItem}>• Enable "Project" toggle in Chat to include files</Text>
            <Text style={styles.tipItem}>• Ask: "Review my code", "Find bugs", "Add TypeScript types"</Text>
          </View>
        </View>
      )}
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
  clearBtn: {
    padding: 4,
  },
  uploadZone: {
    padding: SPACING.lg,
  },
  uploadButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.accentDim,
    borderStyle: 'dashed',
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  uploadTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  uploadSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.tealDim,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  projectInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  projectInfoText: {
    color: COLORS.teal,
    fontSize: 13,
    fontWeight: '600',
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  askButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  fileList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  fileSize: {
    color: COLORS.textDim,
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'stretch',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  tipsTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipItem: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
