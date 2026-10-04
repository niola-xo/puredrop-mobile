import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useCart } from '@/context/cart';
import { useAuth } from '@/context/auth';

export default function CartScreen() {
  const router = useRouter();
  const { itemCount, clearCart } = useCart();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [signInLoading, setSignInLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://puredrop-swart.vercel.app';

  const handleOpenCheckout = () => {
    const target = `${webUrl.replace(/\/$/, '')}/checkout`;
    Linking.openURL(target).catch(() => {});
  };

  const handleSignIn = async () => {
    setSignInLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message);
    }
    setSignInLoading(false);
  };

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Auth gate: Ask signed-out users to sign in (AC-M2.5)
  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.authGateContainer}>
          <Text style={styles.authGateIcon}>🔒</Text>
          <Text style={styles.authGateTitle}>Sign in to view your cart</Text>
          <Text style={styles.authGateSubtitle}>
            Sign in with Google to sync your cart live between your phone and the PureDrop website.
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.signInButton}
            activeOpacity={0.8}
            onPress={handleSignIn}
            disabled={signInLoading}
          >
            {signInLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.signInButtonText}>Continue with Google</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {itemCount === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse our catalogue of pure water refills and packs to start ordering.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            activeOpacity={0.8}
            onPress={() => router.push('/')}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cartContent}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Cart Summary</Text>
            <Text style={styles.summaryItems}>{itemCount} item(s) selected</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => clearCart()}
            >
              <Text style={styles.clearButtonText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.webNoticeCard}>
            <Text style={styles.webNoticeTitle}>ℹ️ Checkout on Web</Text>
            <Text style={styles.webNoticeText}>
              Checkout is on the website. Complete your order securely online.
            </Text>
            <TouchableOpacity
              style={styles.checkoutLinkButton}
              activeOpacity={0.8}
              onPress={handleOpenCheckout}
            >
              <Text style={styles.checkoutLinkButtonText}>Go to Website Checkout ↗</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    flexGrow: 1,
  },
  authGateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 14,
  },
  authGateIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  authGateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  authGateSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
  },
  signInButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  browseButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  cartContent: {
    gap: 16,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryItems: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  clearButtonText: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  webNoticeCard: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 8,
  },
  webNoticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  webNoticeText: {
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  checkoutLinkButton: {
    marginTop: 6,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutLinkButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
