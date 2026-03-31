import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, RADIUS } from '../styles/colors';

const MessageBubble = memo(({ message, isLast }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return <UserBubble message={message} />;
  }
  return <AssistantBubble message={message} isLast={isLast} />;
});

function UserBubble({ message }) {
  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{message.content}</Text>
      </View>
    </View>
  );
}

function AssistantBubble({ message, isLast }) {
  const segments = parseContent(message.content);

  return (
    <View style={styles.aiRow}>
      <View style={styles.aiAvatar}>
        <Text style={styles.aiAvatarText}>AI</Text>
      </View>
      <View style={styles.aiBubble}>
        {message.streaming && message.content === '' ? (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.typingText}>Thinking...</Text>
          </View>
        ) : (
          <>
            {segments.map((seg, i) =>
              seg.type === 'code' ? (
                <CodeBlock key={i} code={seg.content} language={seg.language} />
              ) : (
                <TextSegment key={i} text={seg.content} />
              )
            )}
            {message.streaming && (
              <View style={styles.streamingCursor} />
            )}
          </>
        )}
      </View>
    </View>
  );
}

function TextSegment({ text }) {
  if (!text.trim()) return null;
  const lines = text.split('\n');

  return (
    <View style={styles.textSegment}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <Text key={i} style={styles.h3}>{line.slice(4)}</Text>;
        }
        if (line.startsWith('## ')) {
          return <Text key={i} style={styles.h2}>{line.slice(3)}</Text>;
        }
        if (line.startsWith('# ')) {
          return <Text key={i} style={styles.h1}>{line.slice(2)}</Text>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <InlineText text={line.slice(2)} style={styles.aiText} />
            </View>
          );
        }
        if (/^\d+\. /.test(line)) {
          const match = line.match(/^(\d+)\. (.*)/);
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>{match[1]}.</Text>
              <InlineText text={match[2]} style={styles.aiText} />
            </View>
          );
        }
        if (line === '') {
          return <View key={i} style={styles.emptyLine} />;
        }
        return <InlineText key={i} text={line} style={styles.aiText} />;
      })}
    </View>
  );
}

function InlineText({ text, style }) {
  // Handle **bold** and `inline code`
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', content: text.slice(last, match.index) });
    }
    if (match[0].startsWith('**')) {
      parts.push({ type: 'bold', content: match[0].slice(2, -2) });
    } else {
      parts.push({ type: 'inline_code', content: match[0].slice(1, -1) });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) });
  }

  if (parts.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <Text style={style}>
      {parts.map((p, i) => {
        if (p.type === 'bold') return <Text key={i} style={styles.bold}>{p.content}</Text>;
        if (p.type === 'inline_code') return <Text key={i} style={styles.inlineCode}>{p.content}</Text>;
        return <Text key={i}>{p.content}</Text>;
      })}
    </Text>
  );
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <View style={styles.codeBlock}>
      <View style={styles.codeHeader}>
        <Text style={styles.codeLang}>{language || 'code'}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={copied ? COLORS.success : COLORS.textMuted}
          />
          <Text style={[styles.copyText, copied && styles.copyTextDone]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.codeScroll}>
        <Text style={styles.codeText}>{code}</Text>
      </ScrollView>
    </View>
  );
}

// Parse message content into text and code segments
function parseContent(content) {
  if (!content) return [{ type: 'text', content: '' }];
  const segments = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', content: content.slice(last, match.index) });
    }
    segments.push({ type: 'code', language: match[1] || 'code', content: match[2].trim() });
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    segments.push({ type: 'text', content: content.slice(last) });
  }
  return segments.length > 0 ? segments : [{ type: 'text', content }];
}

export default MessageBubble;

const styles = StyleSheet.create({
  userRow: {
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderRadius: RADIUS.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    maxWidth: '82%',
  },
  userText: {
    color: COLORS.userBubbleText,
    fontSize: 15,
    lineHeight: 22,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    gap: SPACING.sm,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  aiAvatarText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiBubble: {
    flex: 1,
    backgroundColor: COLORS.aiBubble,
    borderRadius: RADIUS.lg,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  typingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  streamingCursor: {
    width: 8,
    height: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 1,
    opacity: 0.8,
    marginTop: 2,
  },
  textSegment: {
    gap: 2,
  },
  aiText: {
    color: COLORS.aiBubbleText,
    fontSize: 14,
    lineHeight: 22,
  },
  h1: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
  },
  h2: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  h3: {
    color: COLORS.accentLight,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.text,
  },
  inlineCode: {
    fontFamily: 'Courier New',
    fontSize: 13,
    color: COLORS.teal,
    backgroundColor: COLORS.codeBlock,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: COLORS.accent,
    fontSize: 14,
    lineHeight: 22,
    flexShrink: 0,
  },
  emptyLine: {
    height: 6,
  },
  codeBlock: {
    backgroundColor: COLORS.codeBlock,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.codeBorder,
    overflow: 'hidden',
    marginVertical: 4,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.codeHeader,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.codeBorder,
  },
  codeLang: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.surfaceHigher,
    borderRadius: RADIUS.full,
  },
  copyText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  copyTextDone: {
    color: COLORS.success,
  },
  codeScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  codeText: {
    fontFamily: 'Courier New',
    fontSize: 13,
    color: '#c9d1d9',
    lineHeight: 20,
  },
});
