import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * FileService - Lightweight file handling.
 * Reads file content without heavy memory usage.
 * Max file size: 5MB to protect low-end devices.
 */
class FileService {
  MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  MAX_FILES_IN_PROJECT = 50;

  /**
   * Pick a ZIP file or individual code files
   */
  async pickProjectFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/zip',
          'application/x-zip-compressed',
          'text/plain',
          'text/javascript',
          'text/typescript',
          'text/x-python',
          'application/json',
          '*/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return null;

      const file = result.assets[0];

      // Check file size
      const info = await FileSystem.getInfoAsync(file.uri);
      if (info.size > this.MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is 5MB. Your file is ${(info.size / 1024 / 1024).toFixed(1)}MB.`);
      }

      return {
        name: file.name,
        uri: file.uri,
        size: info.size,
        type: file.mimeType,
      };
    } catch (err) {
      if (err.message?.includes('too large')) throw err;
      return null;
    }
  }

  /**
   * Pick multiple code files
   */
  async pickMultipleFiles() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets?.length) return [];

      const files = [];
      for (const file of result.assets.slice(0, this.MAX_FILES_IN_PROJECT)) {
        const info = await FileSystem.getInfoAsync(file.uri);
        if (info.size <= this.MAX_FILE_SIZE) {
          files.push({
            name: file.name,
            uri: file.uri,
            size: info.size,
            type: file.mimeType,
          });
        }
      }
      return files;
    } catch {
      return [];
    }
  }

  /**
   * Read file content as text (code files)
   */
  async readFileContent(uri) {
    try {
      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return content;
    } catch {
      // Try base64 for binary files
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `[Binary file - base64 encoded]\n${base64.slice(0, 1000)}...`;
      } catch {
        return '[Could not read file content]';
      }
    }
  }

  /**
   * Build a context string from project files for the AI
   */
  async buildProjectContext(files) {
    if (!files?.length) return '';

    const parts = [`PROJECT CONTEXT (${files.length} files):\n`];
    let totalChars = 0;
    const MAX_CONTEXT_CHARS = 8000; // Keep context manageable

    for (const file of files) {
      if (totalChars >= MAX_CONTEXT_CHARS) {
        parts.push(`\n... (${files.length - files.indexOf(file)} more files truncated for context limit)`);
        break;
      }

      try {
        const content = await this.readFileContent(file.uri);
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const lang = EXT_TO_LANG[ext] || ext || 'text';

        const fileBlock = `\n### File: ${file.name}\n\`\`\`${lang}\n${content.slice(0, 2000)}\n\`\`\`\n`;
        parts.push(fileBlock);
        totalChars += fileBlock.length;
      } catch {
        parts.push(`\n### File: ${file.name} (could not read)\n`);
      }
    }

    return parts.join('');
  }

  /**
   * Save text content to a file and optionally share
   */
  async saveAndShare(content, filename) {
    try {
      const uri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'text/plain',
          dialogTitle: `Save ${filename}`,
        });
      }
      return uri;
    } catch (err) {
      throw new Error(`Save failed: ${err.message}`);
    }
  }

  /**
   * Format file size for display
   */
  formatSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  /**
   * Get language icon/color for a file
   */
  getFileInfo(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return FILE_INFO[ext] || { icon: 'document-text', color: '#888' };
  }

  /**
   * Clean up cached files
   */
  async cleanupCache() {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const items = await FileSystem.readDirectoryAsync(cacheDir);
        for (const item of items) {
          await FileSystem.deleteAsync(cacheDir + item, { idempotent: true });
        }
      }
    } catch {}
  }
}

const EXT_TO_LANG = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php', swift: 'swift',
  kt: 'kotlin', dart: 'dart', html: 'html', css: 'css', scss: 'scss',
  json: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml', md: 'markdown',
  sh: 'bash', bash: 'bash', sql: 'sql', graphql: 'graphql',
};

const FILE_INFO = {
  js: { icon: 'logo-javascript', color: '#f7df1e' },
  jsx: { icon: 'logo-react', color: '#61dafb' },
  ts: { icon: 'code-slash', color: '#3178c6' },
  tsx: { icon: 'logo-react', color: '#61dafb' },
  py: { icon: 'logo-python', color: '#3572A5' },
  go: { icon: 'code', color: '#00add8' },
  rs: { icon: 'code', color: '#dea584' },
  java: { icon: 'cafe', color: '#b07219' },
  php: { icon: 'code', color: '#4f5d95' },
  html: { icon: 'logo-html5', color: '#e34c26' },
  css: { icon: 'logo-css3', color: '#563d7c' },
  json: { icon: 'code-working', color: '#f1e05a' },
  md: { icon: 'document-text', color: '#888' },
  txt: { icon: 'document-text', color: '#888' },
};

export const fileService = new FileService();
export default fileService;
