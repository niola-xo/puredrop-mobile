import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { CartProvider, useCart } from '@/context/cart';

function TabIcon({ icon }: { icon: string }) {
  return <Text style={styles.tabIcon}>{icon}</Text>;
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
        },
        headerTintColor: Colors.primaryDark,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: Colors.text,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
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
          headerTitle: 'PureDrop',
          tabBarLabel: 'Products',
          tabBarIcon: () => <TabIcon icon="💧" />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          headerTitle: 'Your Cart',
          tabBarLabel: 'Cart',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
            color: '#ffffff',
            fontSize: 11,
          },
          tabBarIcon: () => <TabIcon icon="🛒" />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerTitle: 'Account',
          tabBarLabel: 'Account',
          tabBarIcon: () => <TabIcon icon="👤" />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <CartProvider>
      <TabLayoutContent />
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
  },
});
