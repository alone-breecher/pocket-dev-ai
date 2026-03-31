import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../styles/colors';
import { useSettings } from '../hooks/useSettings';

export default function SettingsScreen() {
  const { apiUrl, apiKey, selectedModel, serverOnline, saveConfig, checkServerStatus } = useSettings();

  const [localUrl, setLocalUrl] = useState(apiUrl);
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalUrl(apiUrl);
    setLocalKey(apiKey);
  }, [apiUrl, apiKey]);

  const handleSave = async () => {
    const url = localUrl.trim();
    if (!url) {
      Alert.alert('Invalid URL', 'Please enter a valid server URL.');
      return;
    }
    await saveConfig({ apiUrl: url, apiKey: localKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCheck = async () => {
    setChecking(true);
    await handleSave();
    const online = await checkServerStatus();
    setChecking(false);
    Alert.alert(
      online ? '✅ Connected' : '❌ Unreachable',
      online
        ? 'Successfully connected to your Ollama server.'
        : 'Could not reach the server. Check the URL and ensure Ollama is running with:\n\nOLLAMA_HOST=0.0.0.0 ollama serve',
      [{ text: 'OK' }]
    );
  };

  const QUICK_URLS = [
    { label: 'Localhost (USB)', value: 'http://localhost:11434' },
    { label: 'Local Network', value: 'http://192.168.1.100:11434' },
    { label: 'RunPod', value: 'https://your-pod-id.runpod.net' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Server Config */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={16} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Server Configuration</Text>
          </View>

          <Text style={styles.label}>Ollama API URL</Text>
          <TextInput
            style={styles.input}
            value={localUrl}
            onChangeText={setLocalUrl}
            placeholder="http://your-server:11434"
            placeholderTextColor={COLORS.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            selectionColor={COLORS.accent}
          />

          {/* Quick URL buttons */}
          <Text style={styles.sublabel}>Quick select:</Text>
          <View style={styles.quickUrls}>
            {QUICK_URLS.map(({ label, value }) => (
              <TouchableOpacity
                key={value}
                style={[styles.quickUrlBtn, localUrl === value && styles.quickUrlBtnActive]}
                onPress={() => setLocalUrl(value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickUrlText, localUrl === value && styles.quickUrlTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>API Key (optional)</Text>
          <View style={styles.keyRow}>
            <TextInput
              style={[styles.input, styles.keyInput]}
              value={localKey}
              onChangeText={setLocalKey}
              placeholder="Bearer token or API key"
              placeholderTextColor={COLORS.textDim}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={COLORS.accent}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowKey(!showKey)}
            >
              <Ionicons
                name={showKey ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={16} color="#fff" />
              <Text style={styles.saveButtonText}>{saved ? 'Saved!' : 'Save'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkButton}
              onPress={handleCheck}
              disabled={checking}
              activeOpacity={0.8}
            >
              {checking ? (
                <ActivityIndicator size={16} color={COLORS.accent} />
              ) : (
                <Ionicons
                  name={serverOnline === true ? 'wifi' : serverOnline === false ? 'wifi-outline' : 'pulse-outline'}
                  size={16}
                  color={serverOnline === true ? COLORS.success : serverOnline === false ? COLORS.error : COLORS.accent}
                />
              )}
              <Text style={styles.checkButtonText}>
                {checking ? 'Checking...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status indicator */}
          {serverOnline !== null && (
            <View style={[styles.statusBadge, serverOnline ? styles.statusOnline : styles.statusOffline]}>
              <View style={[styles.statusDot, serverOnline ? styles.dotOnline : styles.dotOffline]} />
              <Text style={[styles.statusText, serverOnline ? styles.statusTextOnline : styles.statusTextOffline]}>
                {serverOnline ? 'Server reachable' : 'Server unreachable'}
              </Text>
            </View>
          )}
        </View>

        {/* Setup Guide */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={16} color={COLORS.teal} />
            <Text style={styles.sectionTitle}>Setup Guide</Text>
          </View>

          <SetupStep
            num="1"
            title="Install Ollama on your server"
            code="curl -fsSL https://ollama.com/install.sh | sh"
          />
          <SetupStep
            num="2"
            title="Start Ollama (allow remote access)"
            code="OLLAMA_HOST=0.0.0.0 ollama serve"
          />
          <SetupStep
            num="3"
            title="Pull a coding model"
            code="ollama pull qwen2.5-coder:7b"
          />
          <SetupStep
            num="4"
            title="Connect from app"
            desc="Enter your server IP above (e.g. http://192.168.1.100:11434)"
          />
        </View>

        {/* App info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.infoText}>PocketDevAI v1.0.0</Text>
          <Text style={styles.infoTextMuted}>
            A lightweight AI coding assistant for Android.{'\n'}
            All AI inference runs on your Ollama server.{'\n'}
            No data is sent to third parties.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SetupStep({ num, title, code, desc }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{num}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        {code && (
          <View style={styles.codeSnippet}>
            <Text style={styles.codeText}>{code}</Text>
          </View>
        )}
        {desc && <Text style={styles.stepDesc}>{desc}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -SPACING.sm,
  },
  sublabel: {
    color: COLORS.textDim,
    fontSize: 11,
    marginBottom: -4,
  },
  input: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: 'Courier New',
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  keyInput: {
    flex: 1,
  },
  eyeBtn: {
    padding: SPACING.sm,
  },
  quickUrls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickUrlBtn: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickUrlBtnActive: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accentDim,
  },
  quickUrlText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  quickUrlTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  checkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusOnline: { backgroundColor: 'rgba(0, 212, 170, 0.1)' },
  statusOffline: { backgroundColor: 'rgba(255, 75, 110, 0.1)' },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: { backgroundColor: COLORS.success },
  dotOffline: { backgroundColor: COLORS.error },
  statusText: { fontSize: 13, fontWeight: '600' },
  statusTextOnline: { color: COLORS.success },
  statusTextOffline: { color: COLORS.error },
  step: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentDim,
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    gap: 6,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  codeSnippet: {
    backgroundColor: COLORS.codeBlock,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.codeBorder,
  },
  codeText: {
    color: COLORS.teal,
    fontSize: 11,
    fontFamily: 'Courier New',
  },
  stepDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  infoText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  infoTextMuted: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
