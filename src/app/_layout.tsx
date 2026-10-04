import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { CartProvider, useCart } from '@/context/cart';
import { AuthProvider } from '@/context/auth';

function HeaderBrand() {
  return (
    <View style={styles.brandContainer}>
      <View style={styles.brandIconCircle}>
        <Text style={styles.brandIconText}>💧</Text>
      </View>
      <Text style={styles.brandNamePure}>
        Pure<Text style={styles.brandNameDrop}>Drop</Text>
      </Text>
    </View>
  );
}

function HeaderCartButton() {
  const router = useRouter();
  const { itemCount } = useCart();

  return (
    <TouchableOpacity
      style={styles.headerCartPill}
      activeOpacity={0.8}
      onPress={() => router.push('/cart')}
    >
      <Text style={styles.headerCartIcon}>🛍️</Text>
      <Text style={styles.headerCartText}>Cart ({itemCount})</Text>
    </TouchableOpacity>
  );
}

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
      <Text style={styles.tabIconText}>{icon}</Text>
    </View>
  );
}

function TabLayoutContent() {
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.8)',
          elevation: 2,
          shadowColor: '#0073cc',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        headerTitle: () => <HeaderBrand />,
        headerRight: () => <HeaderCartButton />,
        tabBarActiveTintColor: Colors.primaryDark,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.9)',
          height: 66,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#0073cc',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Products',
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused }) => <TabIcon icon="💧" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarLabel: 'Cart',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.primaryDark,
            color: '#ffffff',
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ focused }) => <TabIcon icon="🛒" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarLabel: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
          title: 'Checkout',
        }}
      />
      <Tabs.Screen
        name="+not-found"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="auth/callback"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <TabLayoutContent />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0099ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0099ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  brandIconText: {
    fontSize: 16,
  },
  brandNamePure: {
    fontSize: 20,
    fontWeight: '800',
    color: '#001d35',
    letterSpacing: -0.4,
  },
  brandNameDrop: {
    color: '#0061a5',
  },
  headerCartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 16,
    shadowColor: '#0073cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCartIcon: {
    fontSize: 13,
  },
  headerCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0061a5',
  },
  tabIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabIconText: {
    fontSize: 18,
  },
});
