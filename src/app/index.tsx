import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/cart';
import { useAuth } from '@/context/auth';
import { getProductImage, getProductBadge } from '@/lib/products';

interface Product {
  id: string;
  name: string;
  description: string;
  price_ngn: number;
  sort_order: number;
}

export default function ProductsScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { addToCart } = useCart();
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
      const { data, fetchError } = await supabase
        .from('products')
        .select('id, name, description, price_ngn, sort_order')
        .eq('active', true)
        .order('sort_order', { ascending: true }) as any;

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
      }, 1500);
    }
  };

  const formatNaira = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Hero Section matching Web Frutiger Aero Panel */}
      <View style={styles.heroPanel}>
        <View style={styles.hubBadge}>
          <Text style={styles.hubBadgeIcon}>💧</Text>
          <Text style={styles.hubBadgeText}>Akoka & Yaba Direct Factory Supply</Text>
        </View>

        <Text style={styles.heroTitle}>
          Fresh Pure Water Delivered to Your Doorstep,{' '}
          <Text style={styles.heroTitleHighlight}>On Your Schedule</Text>
        </Text>

        <Text style={styles.heroSubtitle}>
          Never run out of pure water again. Pick your batch size, choose weekly or monthly
          deliveries, and select your preferred weekday. Our factory drivers handle the rest.
        </Text>

        <View style={styles.heroButtonsRow}>
          <TouchableOpacity
            style={styles.heroPrimaryBtn}
            activeOpacity={0.85}
            onPress={() => {
              scrollRef.current?.scrollTo({ y: 480, animated: true });
            }}
          >
            <Text style={styles.heroPrimaryBtnText}>Order Water Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroSecondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/cart')}
          >
            <Text style={styles.heroSecondaryBtnText}>View My Cart</Text>
          </TouchableOpacity>
        </View>

        {/* 3 Step Glass Cards (matching media_1791153522629.jpg) */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepCard}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Pick Your Batch</Text>
              <Text style={styles.stepDesc}>
                5-bag, 10-bag, or 20-bag sachet batches or dispenser refills
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Choose Your Day</Text>
              <Text style={styles.stepDesc}>
                Select the weekday you are home for regular weekly or monthly delivery
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Factory Driver Delivery</Text>
              <Text style={styles.stepDesc}>
                Direct from our Akoka factory right to your compound
              </Text>
            </View>
          </View>
        </View>
      </View>

      {feedbackMessage && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      )}

      {/* Catalog Header matching Web (DIRECT FROM HUB, Factory Water Batches) */}
      <View style={styles.catalogHeader}>
        <View>
          <Text style={styles.catalogEyebrow}>DIRECT FROM HUB</Text>
          <Text style={styles.catalogTitle}>Factory Water Batches</Text>
        </View>
        <Text style={styles.catalogSubtitle}>
          Pure, sterilized, sealed in food-grade packs
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
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
        /* Product Cards matching Web UI */
        <View style={styles.cardsList}>
          {products.map((product) => {
            const isAdding = addingId === product.id;
            const isJustAdded = recentlyAddedId === product.id;
            const badge = getProductBadge(product.name);
            const imageSource = getProductImage(product.name);

            return (
              <View key={product.id} style={styles.productCard}>
                {/* Visual Image Container with Pill Badge */}
                <View style={styles.productImageContainer}>
                  <Image
                    source={imageSource}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                  {badge && (
                    <View style={styles.productBadge}>
                      <Text style={styles.productBadgeText}>{badge}</Text>
                    </View>
                  )}
                </View>

                {/* Details */}
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>

                <View style={styles.cardDivider} />

                {/* Bottom Price & Add to Cart action */}
                <View style={styles.cardBottom}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>PRICE</Text>
                    <Text style={styles.productPrice}>{formatNaira(product.price_ngn)}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      isJustAdded && styles.addBtnSuccess,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleAddToCart(product)}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : isJustAdded ? (
                      <Text style={styles.addBtnText}>✓ Added</Text>
                    ) : (
                      <View style={styles.addBtnContent}>
                        <Text style={styles.addBtnCartIcon}>🛒</Text>
                        <Text style={styles.addBtnText}>Add to cart</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Auth Modal */}
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
    backgroundColor: Colors.background, // #cae8ff sky water background
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  heroPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    ...Shadows.glassPanel,
  },
  hubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(60, 249, 220, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0, 107, 92, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    marginBottom: 14,
  },
  hubBadgeIcon: {
    fontSize: 12,
  },
  hubBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#007061',
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#001d35',
    lineHeight: 31,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  heroTitleHighlight: {
    color: '#0061a5',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#3f4753',
    lineHeight: 19,
    marginBottom: 18,
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  heroPrimaryBtn: {
    flex: 1,
    backgroundColor: '#0099ff',
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
    ...Shadows.buttonGloss,
  },
  heroPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  heroSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
  },
  heroSecondaryBtnText: {
    color: '#0061a5',
    fontSize: 13,
    fontWeight: '800',
  },
  stepsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.75)',
    paddingTop: 16,
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0099ff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.buttonGloss,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#001d35',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: '#3f4753',
    lineHeight: 15,
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
  catalogHeader: {
    paddingHorizontal: 2,
    marginTop: 6,
    gap: 2,
  },
  catalogEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0061a5',
    letterSpacing: 0.8,
  },
  catalogTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#001d35',
    letterSpacing: -0.3,
  },
  catalogSubtitle: {
    fontSize: 12,
    color: '#3f4753',
    marginTop: 2,
  },
  cardsList: {
    gap: 18,
    marginTop: 6,
  },
  productCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    padding: 18,
    ...Shadows.glassPanel,
  },
  productImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    backgroundColor: '#eff8ff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 14,
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(60, 249, 220, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 107, 92, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    zIndex: 10,
  },
  productBadgeText: {
    color: '#007061',
    fontSize: 11,
    fontWeight: '800',
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#001d35',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  productDescription: {
    fontSize: 13,
    color: '#3f4753',
    lineHeight: 18,
    marginBottom: 14,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(186, 230, 253, 0.6)',
    marginBottom: 12,
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
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  productPrice: {
    fontSize: 21,
    fontWeight: '800',
    color: '#001d35',
    letterSpacing: -0.3,
  },
  addBtn: {
    backgroundColor: '#0099ff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.buttonGloss,
  },
  addBtnSuccess: {
    backgroundColor: '#10b981',
  },
  addBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addBtnCartIcon: {
    fontSize: 13,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  centerContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#3f4753',
    fontWeight: '600',
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
    backgroundColor: '#0099ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
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
    color: '#3f4753',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 29, 53, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 26,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 14,
    ...Shadows.glassPanel,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e1f3ff',
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
    color: '#001d35',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#3f4753',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalSignInButton: {
    backgroundColor: '#0099ff',
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
    ...Shadows.buttonGloss,
  },
  modalSignInText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  modalCancelButton: {
    paddingVertical: 8,
  },
  modalCancelText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
});
