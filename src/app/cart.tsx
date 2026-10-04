import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useCart } from '@/context/cart';
import { useAuth } from '@/context/auth';

export default function CartScreen() {
  const router = useRouter();
  const { items, itemCount, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [signInLoading, setSignInLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
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

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setActionLoadingId(productId);
    const { error } = await updateQuantity(productId, newQty);
    if (error) {
      setErrorMessage(error.message);
    }
    setActionLoadingId(null);
  };

  const handleRemoveItem = async (productId: string) => {
    setActionLoadingId(productId);
    const { error } = await removeItem(productId);
    if (error) {
      setErrorMessage(error.message);
    }
    setActionLoadingId(null);
  };

  const formatNaira = (price: number) => {
    return `₦${price.toLocaleString()}`;
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
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Itemized Cart List (AC-M4.1) */}
          <View style={styles.itemsSection}>
            {items.map((item) => {
              const unitPrice = item.product?.price_ngn || 0;
              const lineTotal = unitPrice * item.quantity;
              const isItemBusy = actionLoadingId === item.product_id;

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleBlock}>
                      <Text style={styles.itemName}>{item.product?.name || 'Water'}</Text>
                      <Text style={styles.unitPrice}>{formatNaira(unitPrice)} each</Text>
                    </View>
                    <Text style={styles.lineTotal}>{formatNaira(lineTotal)}</Text>
                  </View>

                  <View style={styles.itemFooter}>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={[
                          styles.stepperButton,
                          item.quantity <= 1 && styles.stepperButtonDisabled,
                        ]}
                        disabled={item.quantity <= 1 || isItemBusy}
                        onPress={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                        accessibilityLabel="Decrease quantity"
                      >
                        <Text
                          style={[
                            styles.stepperButtonText,
                            item.quantity <= 1 && styles.stepperButtonTextDisabled,
                          ]}
                        >
                          −
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.quantityDisplay}>
                        {isItemBusy ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.stepperButton,
                          item.quantity >= 99 && styles.stepperButtonDisabled,
                        ]}
                        disabled={item.quantity >= 99 || isItemBusy}
                        onPress={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                        accessibilityLabel="Increase quantity"
                      >
                        <Text
                          style={[
                            styles.stepperButtonText,
                            item.quantity >= 99 && styles.stepperButtonTextDisabled,
                          ]}
                        >
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.removeButton}
                      disabled={isItemBusy}
                      onPress={() => handleRemoveItem(item.product_id)}
                      accessibilityLabel="Remove item"
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Cart Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Cart Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryValue}>{itemCount}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Cart Total</Text>
              <Text style={styles.summaryTotalValue}>{formatNaira(totalAmount)}</Text>
            </View>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => clearCart()}
            >
              <Text style={styles.clearButtonText}>Clear Entire Cart</Text>
            </TouchableOpacity>
          </View>

          {/* Checkout on Web Notice (AC-M4.4) */}
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
  itemsSection: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemTitleBlock: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  unitPrice: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  stepperButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  stepperButtonDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.5,
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  stepperButtonTextDisabled: {
    color: Colors.textMuted,
  },
  quantityDisplay: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
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
