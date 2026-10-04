import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '@/constants/theme';
import { useCart } from '@/context/cart';
import { useAuth } from '@/context/auth';

export default function ProductsScreen() {
  const { itemCount, setItemCount } = useCart();
  const { user, signInWithGoogle } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAddToCart = () => {
    // AC-M2.5: Pressing "Add to cart" asks signed-out users to sign in
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setItemCount(itemCount + 1);
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Products</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💧</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>19L Water Dispenser Bottle</Text>
              <Text style={styles.cardDescription}>
                Purified natural spring water in a durable, reusable 19-litre refill bottle.
              </Text>
              <Text style={styles.cardPrice}>₦2,400</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={handleAddToCart}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📦</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>750ml Bottled Water (Pack of 12)</Text>
              <Text style={styles.cardDescription}>
                Convenient 12-pack of 750ml pure drinking water bottles for on-the-go hydration.
              </Text>
              <Text style={styles.cardPrice}>₦3,600</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={handleAddToCart}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🚰</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Manual Water Pump Dispenser</Text>
              <Text style={styles.cardDescription}>
                Easy-to-use manual hand-press pump for 19L water bottles. No electricity needed.
              </Text>
              <Text style={styles.cardPrice}>₦5,500</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={handleAddToCart}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 20,
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
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
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
