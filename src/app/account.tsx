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
        <ActivityIndicator size="large" color={Colors.primaryDark} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {user ? (
        /* Signed In State */
        <>
          <View style={styles.glassPanel}>
            <View style={styles.avatarCircle}>
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
          <View style={styles.glassPanel}>
            <Text style={styles.infoTitle}>📍 Factory Coverage</Text>
            <Text style={styles.infoBody}>
              Direct supply to Akoka, Yaba, Surulere, and Lagos Mainland. Realtime cart synchronization is active between your phone and the web shop.
            </Text>
          </View>

          {/* Web Shop Portal */}
          <View style={styles.glassPanel}>
            <Text style={styles.infoTitle}>🌐 PureDrop Web Shop</Text>
            <Text style={styles.infoBody}>
              Access admin factory view and desktop subscription management online.
            </Text>
            <TouchableOpacity
              style={styles.linkPill}
              activeOpacity={0.7}
              onPress={openWebStore}
            >
              <Text style={styles.linkPillText}>Visit Web Shop ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.8}
              onPress={handleSignOut}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Text style={styles.logoutBtnText}>Log Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Signed Out State */
        <>
          <View style={styles.glassPanel}>
            <View style={styles.avatarCircle}>
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
              style={styles.googleGlossBtn}
              activeOpacity={0.85}
              onPress={handleSignIn}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.googleGlossBtnText}>Continue with Google</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Footer Details */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerTitle}>PureDrop Mobile v1.0.0</Text>
        <Text style={styles.footerText}>
          Connected to shared Supabase project · Africa/Lagos (UTC+1)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // #cae8ff sky water background
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
    paddingBottom: 48,
  },
  glassPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 22,
    alignItems: 'center',
    gap: 8,
    ...Shadows.glassPanel,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0099ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Shadows.buttonGloss,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#001d35',
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 13,
    color: '#3f4753',
    textAlign: 'center',
    lineHeight: 19,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(60, 249, 220, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 107, 92, 0.25)',
    marginTop: 4,
  },
  verifiedText: {
    color: '#007061',
    fontSize: 12,
    fontWeight: '800',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#001d35',
    alignSelf: 'flex-start',
  },
  infoBody: {
    fontSize: 13,
    color: '#3f4753',
    lineHeight: 19,
    alignSelf: 'flex-start',
  },
  linkPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#e1f3ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  linkPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0061a5',
  },
  actionsSection: {
    gap: 12,
  },
  googleGlossBtn: {
    backgroundColor: '#0099ff',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    ...Shadows.buttonGloss,
  },
  googleGlossBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    padding: 12,
    borderRadius: 14,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
  },
  footerInfo: {
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0061a5',
  },
  footerText: {
    fontSize: 11,
    color: '#3f4753',
    textAlign: 'center',
  },
});
