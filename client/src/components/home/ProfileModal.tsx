import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { User } from '../../types';

interface ProfileModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onEditProfile: () => void;
  onSignOut: () => void;
}

export function ProfileModal({
  visible,
  user,
  onClose,
  onEditProfile,
  onSignOut,
}: ProfileModalProps) {
  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <View style={styles.modalTopRow}>
            <View style={styles.modalAvatar}>
              <Text style={styles.modalAvatarText}>{userInitial}</Text>
            </View>
            <View style={styles.modalUserMeta}>
              <Text style={styles.modalUserName}>{user?.name || 'User Profile'}</Text>
              <Text style={styles.modalUserEmail}>{user?.email || ''}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          {/* Profile Information List */}
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionHeading}>Account Details</Text>

            {user?.phone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            ) : null}

            {user?.address ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{user.address}</Text>
              </View>
            ) : null}

            {user?.business_name ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Business</Text>
                <Text style={styles.infoValue}>{user.business_name}</Text>
              </View>
            ) : null}
          </View>

          {/* Actions: Edit Profile & Sign out */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.editProfileBtn} onPress={onEditProfile}>
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
              <Text style={styles.signOutBtnText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 46, 0.45)',
    justifyContent: 'flex-start',
    paddingTop: 70,
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  modalUserMeta: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  modalUserEmail: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeIcon: {
    fontSize: 18,
    color: Colors.textMuted,
    fontWeight: '600',
    padding: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  infoSection: {
    marginBottom: Spacing.md,
  },
  infoSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
    width: 70,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  modalActions: {
    marginTop: Spacing.sm,
    gap: 8,
  },
  editProfileBtn: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  editProfileBtnText: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  signOutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  signOutBtnText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
