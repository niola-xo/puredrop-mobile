import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { CartProvider, useCart } from '@/context/cart';
import { AuthProvider } from '@/context/auth';

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
          backgroundColor: Colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.primaryDark,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 19,
          color: Colors.text,
          letterSpacing: -0.3,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Products',
          headerTitle: 'PureDrop 💧',
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused }) => <TabIcon icon="💧" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          headerTitle: 'My Cart',
          tabBarLabel: 'Cart',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
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
          headerTitle: 'Account',
          tabBarLabel: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
          title: 'Checkout',
          headerTitle: 'Complete Order',
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
