import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function AccountScreen() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://puredrop-swart.vercel.app';

  const handleSignIn = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message);
    }
    setActionLoading(false);
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    const { error } = await signOut();
    if (error) {
      setErrorMessage(error.message);
    }
    setActionLoading(false);
  };

  const openWebStore = () => {
    Linking.openURL(webUrl).catch(() => {});
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {user ? (
        /* Signed In State */
        <>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {user.email ? user.email.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
            <Text style={styles.userName}>
              {user.user_metadata?.full_name || 'PureDrop Customer'}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Google Account Linked</Text>
            </View>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Delivery Region Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoSectionTitle}>📍 Delivery Coverage</Text>
            <Text style={styles.infoSectionBody}>
              PureDrop delivers to Akoka, Yaba, Surulere, and Lagos Mainland. Realtime cart synchronization is active between this mobile app and the web shop.
            </Text>
          </View>

          {/* Connected Web Shop */}
          <View style={styles.infoCard}>
            <Text style={styles.infoSectionTitle}>🌐 PureDrop Web Shop</Text>
            <Text style={styles.infoSectionBody}>
              Manage admin dashboard or subscriptions from the web portal.
            </Text>
            <TouchableOpacity
              style={styles.linkButton}
              activeOpacity={0.7}
              onPress={openWebStore}
            >
              <Text style={styles.linkButtonText}>Visit Web Shop ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={handleSignOut}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={Colors.danger} />
              ) : (
                <Text style={styles.logoutButtonText}>Log Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Signed Out State */
        <>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>👤</Text>
            </View>
            <Text style={styles.userName}>Guest User</Text>
            <Text style={styles.userEmail}>
              Sign in with your Google account to sync your cart live across your phone and the website, and checkout quickly.
            </Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.googleButton}
              activeOpacity={0.85}
              onPress={handleSignIn}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* App Version & Details */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerTitle}>PureDrop Mobile v1.0.0</Text>
        <Text style={styles.footerText}>
          Connected to shared Supabase project · Lagos Timezone (UTC+1)
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 8,
    ...Shadows.card,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  verifiedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    marginTop: 4,
  },
  verifiedText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...Shadows.card,
  },
  infoSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  infoSectionBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSubtle,
  },
  linkButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionsSection: {
    gap: 12,
  },
  googleButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    ...Shadows.button,
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  footerInfo: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
