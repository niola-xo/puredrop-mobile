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
import { Colors, Shadows } from '@/constants/theme';
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

  // Auth gate
  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.authCard}>
          <View style={styles.authIconCircle}>
            <Text style={styles.authIconText}>🔒</Text>
          </View>
          <Text style={styles.authTitle}>Sign in to view your cart</Text>
          <Text style={styles.authSubtitle}>
            Your cart is synchronized live across all your devices using your Google account.
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.signInButton}
            activeOpacity={0.85}
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
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIconText}>🛒</Text>
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Explore our pure water batches, bottle packs, and dispenser refills to get started.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            activeOpacity={0.85}
            onPress={() => router.push('/')}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cartContainer}>
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Cart Header */}
          <View style={styles.cartHeaderRow}>
            <Text style={styles.cartSectionTitle}>Items in Cart</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
            </View>
          </View>

          {/* Itemized List */}
          <View style={styles.itemsList}>
            {items.map((item) => {
              const unitPrice = item.product?.price_ngn || 0;
              const lineTotal = unitPrice * item.quantity;
              const isItemBusy = actionLoadingId === item.product_id;

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTop}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product?.name || 'Water Product'}</Text>
                      <Text style={styles.unitPrice}>{formatNaira(unitPrice)} each</Text>
                    </View>
                    <Text style={styles.lineTotal}>{formatNaira(lineTotal)}</Text>
                  </View>

                  <View style={styles.itemBottom}>
                    {/* Stepper Controls */}
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={[
                          styles.stepperBtn,
                          item.quantity <= 1 && styles.stepperBtnDisabled,
                        ]}
                        disabled={item.quantity <= 1 || isItemBusy}
                        onPress={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                        accessibilityLabel="Decrease quantity"
                      >
                        <Text
                          style={[
                            styles.stepperBtnText,
                            item.quantity <= 1 && styles.stepperBtnTextDisabled,
                          ]}
                        >
                          −
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.stepperValueContainer}>
                        {isItemBusy ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                          <Text style={styles.stepperValue}>{item.quantity}</Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.stepperBtn,
                          item.quantity >= 99 && styles.stepperBtnDisabled,
                        ]}
                        disabled={item.quantity >= 99 || isItemBusy}
                        onPress={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                        accessibilityLabel="Increase quantity"
                      >
                        <Text
                          style={[
                            styles.stepperBtnText,
                            item.quantity >= 99 && styles.stepperBtnTextDisabled,
                          ]}
                        >
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Remove Action */}
                    <TouchableOpacity
                      style={styles.removeBtn}
                      disabled={isItemBusy}
                      onPress={() => handleRemoveItem(item.product_id)}
                      accessibilityLabel="Remove item"
                    >
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Delivery Region Info */}
          <View style={styles.regionCard}>
            <Text style={styles.regionTitle}>📍 Lagos Delivery Direct</Text>
            <Text style={styles.regionText}>
              Delivery to Akoka, Yaba, Surulere & Mainland. Schedules available for one-time orders or recurring weekly/monthly batches.
            </Text>
          </View>

          {/* Order Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryValue}>{itemCount}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatNaira(totalAmount)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.freeBadge}>FREE (Demo)</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalValue}>{formatNaira(totalAmount)}</Text>
            </View>

            {/* Clear Cart */}
            <TouchableOpacity
              style={styles.clearCartBtn}
              onPress={() => clearCart()}
            >
              <Text style={styles.clearCartText}>Clear all items</Text>
            </TouchableOpacity>
          </View>

          {/* Checkout CTA */}
          <View style={styles.checkoutActionContainer}>
            <TouchableOpacity
              style={styles.primaryCheckoutBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/checkout')}
            >
              <Text style={styles.primaryCheckoutText}>
                Proceed to Checkout ({formatNaira(totalAmount)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.webFallbackBtn}
              activeOpacity={0.7}
              onPress={handleOpenCheckout}
            >
              <Text style={styles.webFallbackText}>Or complete on website ↗</Text>
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
    paddingBottom: 40,
    flexGrow: 1,
  },
  authCard: {
    backgroundColor: Colors.surface,
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
    ...Shadows.card,
  },
  authIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  authIconText: {
    fontSize: 32,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
  },
  signInButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    ...Shadows.button,
  },
  signInButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
    ...Shadows.card,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '800',
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
    paddingVertical: 14,
    borderRadius: 14,
    ...Shadows.button,
  },
  browseButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  cartContainer: {
    gap: 16,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  cartSectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
    ...Shadows.card,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemInfo: {
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
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  stepperBtnDisabled: {
    backgroundColor: Colors.surfaceSubtle,
    opacity: 0.4,
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  stepperBtnTextDisabled: {
    color: Colors.textMuted,
  },
  stepperValueContainer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.dangerLight,
  },
  removeBtnText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  regionCard: {
    backgroundColor: Colors.primaryLight,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    gap: 4,
  },
  regionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  regionText: {
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    ...Shadows.card,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  freeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: -0.3,
  },
  clearCartBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  clearCartText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  checkoutActionContainer: {
    gap: 10,
    marginTop: 4,
  },
  primaryCheckoutBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    ...Shadows.button,
  },
  primaryCheckoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  webFallbackBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  webFallbackText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
