import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '@/constants/theme';
import { useCart } from '@/context/cart';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import {
  WEEKDAYS,
  getWeekdayName,
  getNext30DeliveryDates,
  calculateFirstSubscriptionDeliveryDate,
  formatReadableDate,
} from '@/lib/date';

interface OrderConfirmation {
  orderId: string;
  emailStatus: string;
  orderType: 'one_time' | 'subscription';
  customerName: string;
  address: string;
  deliveryDate?: string;
  frequency?: 'weekly' | 'monthly';
  weekdayName?: string;
  totalNgn: number;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, itemCount, totalAmount, refreshCart } = useCart();
  const { user, signInWithGoogle } = useAuth();

  // Form State
  const [customerName, setCustomerName] = useState(
    user?.user_metadata?.full_name || ''
  );
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [purchaseType, setPurchaseType] = useState<'one_time' | 'subscription'>('one_time');

  // Dates
  const availableDates = useMemo(() => getNext30DeliveryDates(), []);
  const [selectedDate, setSelectedDate] = useState<string>(
    availableDates[0]?.iso || ''
  );

  // Subscription Details
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1); // Default Monday (1)

  // Submitting / UI states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  // Computed first delivery date for subscription
  const firstSubscriptionDate = useMemo(() => {
    return calculateFirstSubscriptionDeliveryDate(selectedWeekday);
  }, [selectedWeekday]);

  const formatNaira = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    // 1. Validation
    if (!user) {
      setErrorMessage('Please sign in with Google to complete your order.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Please enter a valid phone number with at least 10 digits.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please enter your delivery address.');
      return;
    }

    if (itemCount === 0) {
      setErrorMessage('Your cart is empty. Please add items before checking out.');
      return;
    }

    setSubmitting(true);

    try {
      // 2. Obtain fresh Supabase JWT
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (sessionError || !token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      // 3. Prepare payload for POST /api/checkout
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://puredrop-swart.vercel.app';
      const endpoint = `${apiUrl.replace(/\/$/, '')}/api/checkout`;

      const payload = {
        customer_name: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        purchase_type: purchaseType,
        delivery_date: purchaseType === 'one_time' ? selectedDate : undefined,
        frequency: purchaseType === 'subscription' ? frequency : undefined,
        delivery_weekday: purchaseType === 'subscription' ? selectedWeekday : undefined,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Checkout failed (${response.status})`);
      }

      // 4. Success: capture order details and refresh cart
      const confirmedOrder: OrderConfirmation = {
        orderId: data.order_id || 'ORDER',
        emailStatus: data.email_status || 'pending',
        orderType: purchaseType,
        customerName: customerName.trim(),
        address: address.trim(),
        deliveryDate: purchaseType === 'one_time' ? selectedDate : firstSubscriptionDate,
        frequency,
        weekdayName: getWeekdayName(selectedWeekday),
        totalNgn: totalAmount,
      };

      await refreshCart();
      setConfirmation(confirmedOrder);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred during checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  // If user is not authenticated
  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.stateCard}>
          <Text style={styles.stateIcon}>🔒</Text>
          <Text style={styles.stateTitle}>Sign in to Complete Checkout</Text>
          <Text style={styles.stateSubtitle}>
            Please sign in with Google to securely place your order and track delivery.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => signInWithGoogle()}
          >
            <Text style={styles.primaryBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Confirmation view after order is placed
  if (confirmation) {
    const isSent = confirmation.emailStatus === 'sent';
    const emailNotice = isSent
      ? `A confirmation email was sent to ${user.email}.`
      : 'Your order is saved, but we could not send the email.';

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.confirmationCard}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successIconText}>🎉</Text>
          </View>

          <Text style={styles.confTitle}>
            {confirmation.orderType === 'subscription' ? 'Subscription Started!' : 'Order Placed!'}
          </Text>

          <View style={styles.refBadge}>
            <Text style={styles.refBadgeText}>
              Reference: #{confirmation.orderId.slice(0, 8).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.confSubtitle}>
            Thank you, {confirmation.customerName}. Your pure water delivery has been scheduled.
          </Text>

          {/* Details Box */}
          <View style={styles.confDetailsBox}>
            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Type</Text>
              <Text style={styles.confValue}>
                {confirmation.orderType === 'subscription' ? 'Recurring Subscription' : 'One-Time Delivery'}
              </Text>
            </View>

            {confirmation.orderType === 'subscription' && (
              <>
                <View style={styles.confRow}>
                  <Text style={styles.confLabel}>Schedule</Text>
                  <Text style={styles.confValue}>
                    {confirmation.frequency === 'weekly' ? 'Weekly' : 'Monthly'} on {confirmation.weekdayName}s
                  </Text>
                </View>
                <View style={styles.confRow}>
                  <Text style={styles.confLabel}>First Delivery</Text>
                  <Text style={styles.confValue}>
                    {confirmation.deliveryDate ? formatReadableDate(confirmation.deliveryDate) : 'Upcoming'}
                  </Text>
                </View>
              </>
            )}

            {confirmation.orderType === 'one_time' && (
              <View style={styles.confRow}>
                <Text style={styles.confLabel}>Delivery Date</Text>
                <Text style={styles.confValue}>
                  {confirmation.deliveryDate ? formatReadableDate(confirmation.deliveryDate) : 'Upcoming'}
                </Text>
              </View>
            )}

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Delivery Address</Text>
              <Text style={styles.confValue} numberOfLines={2}>
                {confirmation.address}
              </Text>
            </View>

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Total Amount</Text>
              <Text style={styles.confTotalValue}>{formatNaira(confirmation.totalNgn)}</Text>
            </View>
          </View>

          {/* Mailgun Email Status Notice */}
          <View style={[styles.emailNoticeBox, isSent ? styles.emailNoticeSuccess : styles.emailNoticeWarning]}>
            <Text style={styles.emailNoticeIcon}>{isSent ? '📧' : 'ℹ️'}</Text>
            <Text style={[styles.emailNoticeText, isSent ? styles.emailNoticeTextSuccess : styles.emailNoticeTextWarning]}>
              {emailNotice}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/')}
          >
            <Text style={styles.primaryBtnText}>Back to Products</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Empty cart guard
  if (itemCount === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.stateCard}>
          <Text style={styles.stateIcon}>🛒</Text>
          <Text style={styles.stateTitle}>Your Cart is Empty</Text>
          <Text style={styles.stateSubtitle}>
            Add pure water refills or packs to your cart before proceeding to checkout.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/')}
          >
            <Text style={styles.primaryBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Navigation */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/cart')}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← Back to Cart</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 2 of 2</Text>
      </View>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* Step 1: Contact & Delivery Location */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>1</Text>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Niola Bakare"
            placeholderTextColor={Colors.textMuted}
            value={customerName}
            onChangeText={setCustomerName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 08012345678 (min 10 digits)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Text style={styles.inputHint}>Our driver will call this number upon arrival</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Delivery Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Street address, building name, flat number (Akoka, Yaba, etc.)"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Landmark or Area (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Near UNILAG gate, opposite total station"
            placeholderTextColor={Colors.textMuted}
            value={landmark}
            onChangeText={setLandmark}
          />
        </View>
      </View>

      {/* Step 2: Order Type & Schedule */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>2</Text>
          <Text style={styles.sectionTitle}>Delivery Schedule</Text>
        </View>

        {/* Purchase Type Selector */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              purchaseType === 'one_time' && styles.tabBtnActive,
            ]}
            onPress={() => setPurchaseType('one_time')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabBtnText,
                purchaseType === 'one_time' && styles.tabBtnTextActive,
              ]}
            >
              One-Time Order
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              purchaseType === 'subscription' && styles.tabBtnActive,
            ]}
            onPress={() => setPurchaseType('subscription')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabBtnText,
                purchaseType === 'subscription' && styles.tabBtnTextActive,
              ]}
            >
              Subscribe & Save
            </Text>
          </TouchableOpacity>
        </View>

        {purchaseType === 'one_time' ? (
          /* One-Time Date Picker */
          <View style={styles.datePickerSection}>
            <Text style={styles.subSectionTitle}>Select Delivery Date (Next 30 Days)</Text>
            <Text style={styles.subSectionHint}>Earliest delivery is tomorrow (Lagos time)</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesScroll}
            >
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.iso;
                const [y, m, d] = item.iso.split('-').map(Number);
                const dt = new Date(y, m - 1, d);
                const dayName = dt.toLocaleDateString('en-NG', { weekday: 'short' });
                const monthName = dt.toLocaleDateString('en-NG', { month: 'short' });

                return (
                  <TouchableOpacity
                    key={item.iso}
                    style={[
                      styles.datePill,
                      isSelected && styles.datePillSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedDate(item.iso)}
                  >
                    <Text
                      style={[
                        styles.datePillDay,
                        isSelected && styles.datePillDaySelected,
                      ]}
                    >
                      {dayName}
                    </Text>
                    <Text
                      style={[
                        styles.datePillNumber,
                        isSelected && styles.datePillNumberSelected,
                      ]}
                    >
                      {d}
                    </Text>
                    <Text
                      style={[
                        styles.datePillMonth,
                        isSelected && styles.datePillMonthSelected,
                      ]}
                    >
                      {monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.selectedDateBadge}>
              <Text style={styles.selectedDateBadgeText}>
                📅 Scheduled: {formatReadableDate(selectedDate)}
              </Text>
            </View>
          </View>
        ) : (
          /* Subscription Configuration */
          <View style={styles.subConfigSection}>
            <Text style={styles.subSectionTitle}>Delivery Frequency</Text>
            <View style={styles.frequencyRow}>
              <TouchableOpacity
                style={[
                  styles.freqPill,
                  frequency === 'weekly' && styles.freqPillActive,
                ]}
                onPress={() => setFrequency('weekly')}
              >
                <Text
                  style={[
                    styles.freqPillText,
                    frequency === 'weekly' && styles.freqPillTextActive,
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.freqPill,
                  frequency === 'monthly' && styles.freqPillActive,
                ]}
                onPress={() => setFrequency('monthly')}
              >
                <Text
                  style={[
                    styles.freqPillText,
                    frequency === 'monthly' && styles.freqPillTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>Preferred Weekday</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((wd) => {
                const isSelected = selectedWeekday === wd.value;
                return (
                  <TouchableOpacity
                    key={wd.value}
                    style={[
                      styles.weekdayBtn,
                      isSelected && styles.weekdayBtnSelected,
                    ]}
                    onPress={() => setSelectedWeekday(wd.value)}
                  >
                    <Text
                      style={[
                        styles.weekdayBtnText,
                        isSelected && styles.weekdayBtnTextSelected,
                      ]}
                    >
                      {wd.label.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Computed First Delivery Notice */}
            <View style={styles.computedFirstDateBox}>
              <Text style={styles.computedFirstDateTitle}>
                📅 First Scheduled Delivery
              </Text>
              <Text style={styles.computedFirstDateValue}>
                {formatReadableDate(firstSubscriptionDate)} ({getWeekdayName(selectedWeekday)})
              </Text>
              <Text style={styles.computedFirstDateHint}>
                Repeats {frequency === 'weekly' ? 'every week' : 'every 4 weeks'} on {getWeekdayName(selectedWeekday)}. You can pause or cancel anytime.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Step 3: Order Review & Demo Payment */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>3</Text>
          <Text style={styles.sectionTitle}>Order Review & Payment</Text>
        </View>

        {/* Item Summary */}
        <View style={styles.itemsSummary}>
          {items.map((i) => (
            <View key={i.id} style={styles.summaryItemRow}>
              <Text style={styles.summaryItemName}>
                {i.quantity}x {i.product?.name || 'Water'}
              </Text>
              <Text style={styles.summaryItemPrice}>
                {formatNaira((i.product?.price_ngn || 0) * i.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.summaryDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatNaira(totalAmount)}</Text>
          </View>
        </View>

        {/* Demo Mode Notice (AC4.6) */}
        <View style={styles.demoNoticeCard}>
          <View style={styles.demoHeader}>
            <Text style={styles.demoIcon}>🛡️</Text>
            <Text style={styles.demoTitle}>Demo Mode: No Real Payment Taken</Text>
          </View>
          <Text style={styles.demoText}>
            This application is for demonstration and evaluation. No debit card or banking credentials are required. Clicking below records your order securely in the database.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.btnDisabled]}
          activeOpacity={0.85}
          onPress={handlePlaceOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {purchaseType === 'subscription' ? 'Start Subscription' : 'Place Order'} ({formatNaira(totalAmount)})
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSubtle,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 10,
  },
  sectionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    color: Colors.primaryDark,
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 74,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadows.card,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: Colors.primaryDark,
  },
  datePickerSection: {
    gap: 10,
    marginTop: 6,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  subSectionHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -4,
  },
  datesScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  datePill: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 2,
  },
  datePillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    ...Shadows.button,
  },
  datePillDay: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  datePillDaySelected: {
    color: '#ffffff',
  },
  datePillNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  datePillNumberSelected: {
    color: '#ffffff',
  },
  datePillMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  datePillMonthSelected: {
    color: '#ffffff',
  },
  selectedDateBadge: {
    backgroundColor: Colors.primaryLight,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
  },
  selectedDateBadgeText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  subConfigSection: {
    gap: 8,
    marginTop: 6,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freqPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
  },
  freqPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  freqPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  freqPillTextActive: {
    color: Colors.primaryDark,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  weekdayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  weekdayBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  weekdayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  weekdayBtnTextSelected: {
    color: '#ffffff',
  },
  computedFirstDateBox: {
    marginTop: 10,
    backgroundColor: Colors.primaryLight,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    gap: 4,
  },
  computedFirstDateTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  computedFirstDateValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  computedFirstDateHint: {
    fontSize: 11,
    color: Colors.primaryDark,
    lineHeight: 16,
  },
  itemsSummary: {
    gap: 8,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemName: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  demoNoticeCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 14,
    borderRadius: 14,
    gap: 4,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoIcon: {
    fontSize: 16,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  demoText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 17,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    ...Shadows.button,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  stateCard: {
    backgroundColor: Colors.surface,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  stateIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  confirmationCard: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 12,
    ...Shadows.card,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconText: {
    fontSize: 32,
  },
  confTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  refBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  refBadgeText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  confDetailsBox: {
    width: '100%',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginVertical: 4,
  },
  confRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  confLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  confValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  confTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  emailNoticeBox: {
    width: '100%',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  emailNoticeSuccess: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  emailNoticeWarning: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  emailNoticeIcon: {
    fontSize: 16,
  },
  emailNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  emailNoticeTextSuccess: {
    color: '#065f46',
  },
  emailNoticeTextWarning: {
    color: '#92400e',
  },
});
