import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

/**
 * In-app reporting of AI-generated content. Google Play's AI-Generated
 * Content policy requires users to be able to flag offensive AI output
 * without leaving the app; reports go to POST /api/reports/ai-content.
 */

const REASONS: Array<{ value: string; label: string }> = [
  { value: 'offensive', label: 'Offensive or inappropriate' },
  { value: 'harmful', label: 'Harmful or unsafe' },
  { value: 'inaccurate', label: 'Inaccurate or misleading' },
  { value: 'other', label: 'Something else' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  content: string;
  speaker?: string;
  sessionId?: number | string | null;
  source: 'live' | 'report';
};

export function ReportAiSheet({ visible, onClose, content, speaker, sessionId, source }: Props) {
  const { authFetch } = useAuth();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const close = () => {
    setReason(null);
    setDetails('');
    setState('idle');
    setMessage('');
    onClose();
  };

  const submit = async () => {
    if (!reason) return;
    setState('sending');
    try {
      const res = await authFetch('/api/reports/ai-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          reason,
          details: details.trim() || undefined,
          speaker,
          sessionId: sessionId ?? undefined,
          source,
          platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send your report.');
      setState('sent');
      setMessage(data.message || 'Thanks — our team will review this response.');
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Could not send your report.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Report AI response</Text>
          <Text style={styles.quote} numberOfLines={4}>
            {speaker ? `${speaker}: ` : ''}
            {content}
          </Text>

          {state === 'sent' ? (
            <Text style={styles.done}>{message}</Text>
          ) : (
            <>
              <Text style={styles.label}>What's wrong with it?</Text>
              {REASONS.map((r) => (
                <Pressable
                  key={r.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: reason === r.value }}
                  onPress={() => setReason(r.value)}
                  style={[styles.reason, reason === r.value && styles.reasonActive]}
                >
                  <Text style={[styles.reasonText, reason === r.value && styles.reasonTextActive]}>{r.label}</Text>
                </Pressable>
              ))}
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Add details (optional)"
                placeholderTextColor={colors.textMuted}
                style={styles.details}
                multiline
                maxLength={1000}
              />
              {state === 'error' ? <Text style={styles.error}>{message}</Text> : null}
            </>
          )}

          <View style={styles.actions}>
            <Pressable onPress={close} style={styles.secondary}>
              <Text style={styles.secondaryText}>{state === 'sent' ? 'Close' : 'Cancel'}</Text>
            </Pressable>
            {state !== 'sent' ? (
              <Pressable
                onPress={submit}
                disabled={!reason || state === 'sending'}
                style={[styles.primary, (!reason || state === 'sending') && styles.primaryDisabled]}
              >
                {state === 'sending' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Send report</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  quote: {
    color: colors.textSecondary,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontStyle: 'italic',
  },
  label: { fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  reason: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  reasonActive: { borderColor: colors.primary, backgroundColor: '#eef2ff' },
  reasonText: { color: colors.textSecondary, fontWeight: '600' },
  reasonTextActive: { color: colors.primaryDark },
  details: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 64,
    color: colors.text,
    textAlignVertical: 'top',
  },
  error: { color: colors.danger },
  done: { color: colors.success, fontWeight: '700', paddingVertical: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  secondary: { paddingVertical: 12, paddingHorizontal: spacing.md },
  secondaryText: { color: colors.textMuted, fontWeight: '700' },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontWeight: '800' },
});
