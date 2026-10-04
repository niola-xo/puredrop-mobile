import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Colors } from '@/constants/theme';
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
  const { addToCart } = useCart();
  const { user, signInWithGoogle } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
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
    // AC-M2.5: Ask signed-out users to sign in
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setAddingId(product.id);
    const { error: addError } = await addToCart(product.id);
    setAddingId(null);

    if (addError) {
      setFeedbackMessage(`Error: ${addError.message}`);
    } else {
      setFeedbackMessage(`Added ${product.name} to cart!`);
    }

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2500);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>Pure & Refreshing</Text>
        <Text style={styles.heroTitle}>Premium Water Delivered to Your Doorstep</Text>
        <Text style={styles.heroSubtitle}>
          Order 19L dispenser refills, bottled packs, and dispenser accessories anywhere in Lagos.
        </Text>
      </View>

      {feedbackMessage && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Products</Text>
          <TouchableOpacity onPress={fetchProducts}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading fresh products...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Could not load products: {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available at the moment.</Text>
          </View>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{getProductIcon(product.name)}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardDescription}>{product.description}</Text>
                  <Text style={styles.cardPrice}>{formatNaira(product.price_ngn)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.8}
                onPress={() => handleAddToCart(product)}
                disabled={addingId === product.id}
              >
                {addingId === product.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.addButtonText}>Add to Cart</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Auth Prompt Modal (AC-M2.5) */}
      <Modal
        visible={showAuthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>🔒</Text>
            <Text style={styles.modalTitle}>Sign In Required</Text>
            <Text style={styles.modalSubtitle}>
              Please sign in with Google to add items to your cart and sync across devices.
            </Text>
            <TouchableOpacity
              style={styles.modalSignInButton}
              activeOpacity={0.8}
              onPress={() => {
                setShowAuthModal(false);
                signInWithGoogle();
              }}
            >
              <Text style={styles.modalSignInText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
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
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  feedbackBanner: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  feedbackText: {
    color: '#065f46',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  refreshText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  cardIcon: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalSignInButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  modalSignInText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalCancelButton: {
    paddingVertical: 8,
  },
  modalCancelText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
});
