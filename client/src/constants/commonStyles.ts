import { StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from './theme';

/**
 * Reusable layout, typography, and container styles across the mobile app.
 */
export const CommonStyles = StyleSheet.create({
  // Screen wrappers
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Headers
  header: {
    marginBottom: Spacing.xl,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 22,
  },

  // Navigation
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  // Forms & Actions
  form: {
    width: '100%',
  },
  actionContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
});
