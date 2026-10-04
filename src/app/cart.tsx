import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '@/constants/theme';
import { useCart } from '@/context/cart';
import { useAuth } from '@/context/auth';
import { getProductImage } from '@/lib/products';

export default function CartScreen() {
  const router = useRouter();
  const { items, itemCount, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [signInLoading, setSignInLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        <ActivityIndicator size="large" color={Colors.primaryDark} />
      </View>
    );
  }

  // Auth gate
  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.glassCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconCircleText}>🔒</Text>
          </View>
          <Text style={styles.cardTitle}>Sign in to view your cart</Text>
          <Text style={styles.cardSubtitle}>
            Your cart is synchronized live across all your devices using your Google account.
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryGlossBtn}
            activeOpacity={0.85}
            onPress={handleSignIn}
            disabled={signInLoading}
          >
            {signInLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryGlossBtnText}>Continue with Google</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {itemCount === 0 ? (
        <View style={styles.glassCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconCircleText}>🛒</Text>
          </View>
          <Text style={styles.cardTitle}>Your cart is empty</Text>
          <Text style={styles.cardSubtitle}>
            {"You haven't added any pure water batches yet. Pick your batch size or dispenser refill to get started."}
          </Text>
          <TouchableOpacity
            style={styles.primaryGlossBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/')}
          >
            <Text style={styles.primaryGlossBtnText}>Browse Water Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cartContainer}>
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Cart Header matching Web */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerEyebrow}>REVIEW ORDER</Text>
              <Text style={styles.headerTitle}>Your Water Cart</Text>
            </View>
            <TouchableOpacity onPress={() => clearCart()}>
              <Text style={styles.clearText}>Clear cart</Text>
            </TouchableOpacity>
          </View>

          {/* Items Glass Card matching Web */}
          <View style={styles.glassPanel}>
            {items.map((item, index) => {
              const unitPrice = item.product?.price_ngn || 0;
              const lineTotal = unitPrice * item.quantity;
              const isItemBusy = actionLoadingId === item.product_id;
              const imageSource = getProductImage(item.product?.name || '');

              return (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    index < items.length - 1 && styles.itemRowBorder,
                  ]}
                >
                  <View style={styles.itemTop}>
                    <View style={styles.imageThumbnail}>
                      <Image
                        source={imageSource}
                        style={styles.thumbnailImg}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.product?.name || 'Water'}</Text>
                      <Text style={styles.itemUnitPrice}>
                        Unit Price: {formatNaira(unitPrice)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemControlsRow}>
                    {/* Stepper */}
                    <View style={styles.stepperPill}>
                      <TouchableOpacity
                        style={[
                          styles.stepperBtn,
                          item.quantity <= 1 && styles.stepperBtnDisabled,
                        ]}
                        disabled={item.quantity <= 1 || isItemBusy}
                        onPress={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>

                      <View style={styles.stepperValueContainer}>
                        {isItemBusy ? (
                          <ActivityIndicator size="small" color={Colors.primaryDark} />
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
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Line Total */}
                    <Text style={styles.lineTotal}>{formatNaira(lineTotal)}</Text>

                    {/* Remove */}
                    <TouchableOpacity
                      style={styles.removeBtn}
                      disabled={isItemBusy}
                      onPress={() => handleRemoveItem(item.product_id)}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Order Summary Glass Card matching Web */}
          <View style={styles.glassPanel}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatNaira(totalAmount)}</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryGlossBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/checkout')}
            >
              <Text style={styles.primaryGlossBtnText}>
                Proceed to Checkout ({formatNaira(totalAmount)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => router.push('/')}
            >
              <Text style={styles.backLinkText}>← Add more water products</Text>
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
    paddingBottom: 48,
    flexGrow: 1,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 28,
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
    ...Shadows.glassPanel,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e1f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconCircleText: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#001d35',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#3f4753',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
  },
  primaryGlossBtn: {
    backgroundColor: '#0099ff',
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
    ...Shadows.buttonGloss,
  },
  primaryGlossBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
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
    fontWeight: '700',
    textAlign: 'center',
  },
  cartContainer: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0061a5',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#001d35',
    letterSpacing: -0.3,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  glassPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 18,
    gap: 14,
    ...Shadows.glassPanel,
  },
  itemRow: {
    paddingVertical: 10,
    gap: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(186, 230, 253, 0.6)',
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#eff8ff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImg: {
    width: '90%',
    height: '90%',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#001d35',
    marginBottom: 2,
  },
  itemUnitPrice: {
    fontSize: 12,
    color: '#3f4753',
  },
  itemControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#001d35',
  },
  stepperValueContainer: {
    width: 32,
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#001d35',
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#001d35',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(186, 230, 253, 0.6)',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3f4753',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#001d35',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0061a5',
  },
});
