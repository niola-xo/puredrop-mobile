import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AccountScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.userName}>Guest User</Text>
        <Text style={styles.userEmail}>Sign in to sync your cart with PureDrop web</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.googleButton}
          activeOpacity={0.8}
          onPress={() => {}}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About PureDrop Mobile</Text>
        <Text style={styles.infoText}>
          Version 1.0.0{'\n'}
          Connected to shared PureDrop backend
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  googleButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  infoSection: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
