import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/cart';
import { useAuth } from '@/context/auth';

interface Product {
  id: string;
  name: string;
  description: string;
  price_ngn: number;
  sort_order: number;
}

export default function ProductsScreen() {
  const { items, addToCart } = useCart();
  const { user, signInWithGoogle } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, name, description, price_ngn, sort_order')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setProducts(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    supabase
      .from('products')
      .select('id, name, description, price_ngn, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(
        ({ data, error: fetchError }) => {
          if (!active) return;
          if (fetchError) {
            setError(fetchError.message);
          } else if (data) {
            setProducts(data);
          }
          setLoading(false);
        },
        (err: unknown) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : 'Failed to load products');
          setLoading(false);
        }
      );

    return () => {
      active = false;
    };
  }, []);

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setAddingId(product.id);
    const { error: addError } = await addToCart(product.id);
    setAddingId(null);

    if (addError) {
      setFeedbackMessage(`Error: ${addError.message}`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } else {
      setRecentlyAddedId(product.id);
      setTimeout(() => {
        setRecentlyAddedId((prev) => (prev === product.id ? null : prev));
      }, 1800);
    }
  };

  const formatNaira = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const getProductIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('dispenser') || lower.includes('refill')) return '🚰';
    if (lower.includes('table water') || lower.includes('pack')) return '📦';
    return '💧';
  };

  const getProductIconBg = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('dispenser') || lower.includes('refill')) return '#eff6ff';
    if (lower.includes('table water') || lower.includes('pack')) return '#ecfdf5';
    return '#f0f9ff';
  };

  const getQuantityInCart = (productId: string) => {
    const cartItem = items.find((i) => i.product_id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Modern Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>💧 LAGOS DIRECT REFILL</Text>
          </View>
          <Text style={styles.heroLocation}>Akoka · Yaba · Mainland</Text>
        </View>

        <Text style={styles.heroTitle}>Fresh, Pure Water at Factory Prices</Text>
        <Text style={styles.heroSubtitle}>
          Order 19L dispenser refills, pure water batches, and bottled packs with fast local delivery.
        </Text>

        <View style={styles.trustBadgesRow}>
          <View style={styles.trustPill}>
            <Text style={styles.trustPillText}>⚡ Same-Day Delivery</Text>
          </View>
          <View style={styles.trustPill}>
            <Text style={styles.trustPillText}>🛡️ Factory Pure</Text>
          </View>
          <View style={styles.trustPill}>
            <Text style={styles.trustPillText}>🔁 Subscriptions</Text>
          </View>
        </View>
      </View>

      {feedbackMessage && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      )}

      {/* Catalog Section */}
      <View style={styles.catalogSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Available Products</Text>
            <Text style={styles.sectionSubtitle}>Tap to add to your live cart</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchProducts}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshText}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching available water inventory...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Could not load catalog</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available right now.</Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {products.map((product) => {
              const qtyInCart = getQuantityInCart(product.id);
              const isAdding = addingId === product.id;
              const isJustAdded = recentlyAddedId === product.id;

              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: getProductIconBg(product.name) },
                      ]}
                    >
                      <Text style={styles.productIcon}>{getProductIcon(product.name)}</Text>
                    </View>

                    <View style={styles.titleArea}>
                      <View style={styles.titleRow}>
                        <Text style={styles.productName}>{product.name}</Text>
                      </View>
                      <Text style={styles.productDescription}>{product.description}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardBottom}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>PRICE</Text>
                      <Text style={styles.productPrice}>{formatNaira(product.price_ngn)}</Text>
                      {qtyInCart > 0 && (
                        <View style={styles.inCartBadge}>
                          <Text style={styles.inCartBadgeText}>{qtyInCart} in cart</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        isJustAdded && styles.addedButton,
                        isAdding && styles.addingButton,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleAddToCart(product)}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : isJustAdded ? (
                        <Text style={styles.addedButtonText}>✓ Added</Text>
                      ) : (
                        <Text style={styles.addButtonText}>+ Add to Cart</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Auth Prompt Modal */}
      <Modal
        visible={showAuthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>💧</Text>
            </View>

            <Text style={styles.modalTitle}>Sign in to Continue</Text>
            <Text style={styles.modalSubtitle}>
              Sign in with your Google account to add items to your cart, sync live with the website, and checkout.
            </Text>

            <TouchableOpacity
              style={styles.modalSignInButton}
              activeOpacity={0.85}
              onPress={() => {
                setShowAuthModal(false);
                signInWithGoogle();
              }}
            >
              <Text style={styles.modalSignInText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              activeOpacity={0.7}
              onPress={() => setShowAuthModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  heroBadgeText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroLocation: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  trustPill: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trustPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  feedbackBanner: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.successBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  feedbackText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: 14,
  },
  catalogSection: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSubtle,
  },
  refreshText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  cardsList: {
    gap: 14,
  },
  productCard: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIcon: {
    fontSize: 24,
  },
  titleArea: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
  },
  productDescription: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  productPrice: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  inCartBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  inCartBadgeText: {
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 125,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  addingButton: {
    opacity: 0.8,
  },
  addedButton: {
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  addedButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  centerContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 24,
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 26,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 14,
    ...Shadows.cardHover,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalIconText: {
    fontSize: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalSignInButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
    ...Shadows.button,
  },
  modalSignInText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalCancelButton: {
    paddingVertical: 8,
  },
  modalCancelText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
});
