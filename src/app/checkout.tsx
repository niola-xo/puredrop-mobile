import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '@/constants/theme';
import { useCart } from '@/context/cart';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { getProductImage } from '@/lib/products';
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
  const [orderType, setOrderType] = useState<'one_time' | 'subscription'>('one_time');

  // Dates
  const availableDates = useMemo(() => getNext30DeliveryDates(), []);
  const [selectedDate, setSelectedDate] = useState<string>(
    availableDates[0]?.iso || ''
  );

  // Subscription Details
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1); // Monday

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

    if (!user) {
      setErrorMessage('Please sign in with Google to complete your order.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Phone number must have at least 10 digits.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Delivery address is required.');
      return;
    }

    if (itemCount === 0) {
      setErrorMessage('Your cart is empty. Add water products before checkout.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (sessionError || !token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://puredrop-swart.vercel.app';
      const endpoint = `${apiUrl.replace(/\/$/, '')}/api/checkout`;

      const payload = {
        customer_name: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        purchase_type: orderType,
        delivery_date: orderType === 'one_time' ? selectedDate : undefined,
        frequency: orderType === 'subscription' ? frequency : undefined,
        delivery_weekday: orderType === 'subscription' ? selectedWeekday : undefined,
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

      const confirmedOrder: OrderConfirmation = {
        orderId: data.order_id || 'ORDER',
        emailStatus: data.email_status || 'pending',
        orderType,
        customerName: customerName.trim(),
        address: address.trim(),
        deliveryDate: orderType === 'one_time' ? selectedDate : firstSubscriptionDate,
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

  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.glassCard}>
          <Text style={styles.stateIcon}>🔒</Text>
          <Text style={styles.cardTitle}>Sign in to Complete Checkout</Text>
          <Text style={styles.cardSubtitle}>
            Please sign in with Google to securely place your order and track delivery.
          </Text>
          <TouchableOpacity
            style={styles.primaryGlossBtn}
            activeOpacity={0.85}
            onPress={() => signInWithGoogle()}
          >
            <Text style={styles.primaryGlossBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Confirmation view matching Web order receipt
  if (confirmation) {
    const isSent = confirmation.emailStatus === 'sent';
    const emailNotice = isSent
      ? `A confirmation email was sent to ${user.email}.`
      : 'Your order is saved, but we could not send the email.';

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.glassCard}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>

          <Text style={styles.cardTitle}>
            {confirmation.orderType === 'subscription' ? 'Subscription Started!' : 'Order Confirmed!'}
          </Text>

          <View style={styles.refBadge}>
            <Text style={styles.refBadgeText}>
              Reference: #{confirmation.orderId.slice(0, 8).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.cardSubtitle}>
            Thank you, {confirmation.customerName}. Your pure water delivery has been scheduled.
          </Text>

          <View style={styles.confDetails}>
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
              <Text style={styles.confLabel}>Address</Text>
              <Text style={styles.confValue} numberOfLines={2}>
                {confirmation.address}
              </Text>
            </View>

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Total Amount</Text>
              <Text style={styles.confTotalValue}>{formatNaira(confirmation.totalNgn)}</Text>
            </View>
          </View>

          <View style={[styles.emailNoticeBox, isSent ? styles.emailNoticeSuccess : styles.emailNoticeWarning]}>
            <Text style={styles.emailNoticeIcon}>{isSent ? '📧' : 'ℹ️'}</Text>
            <Text style={[styles.emailNoticeText, isSent ? styles.emailNoticeTextSuccess : styles.emailNoticeTextWarning]}>
              {emailNotice}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryGlossBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/')}
          >
            <Text style={styles.primaryGlossBtnText}>Back to Products</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Empty cart guard
  if (itemCount === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.glassCard}>
          <Text style={styles.stateIcon}>🛒</Text>
          <Text style={styles.cardTitle}>Cart is empty</Text>
          <Text style={styles.cardSubtitle}>
            You need at least one water product in your cart to proceed with checkout.
          </Text>
          <TouchableOpacity
            style={styles.primaryGlossBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/')}
          >
            <Text style={styles.primaryGlossBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top back link */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/cart')}
        >
          <Text style={styles.backBtnText}>← Back to Cart</Text>
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* Delivery Details Card */}
      <View style={styles.glassPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Delivery Details</Text>
          <Text style={styles.panelSubtitle}>
            Ordering as <Text style={styles.userEmailText}>{user.email}</Text>
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>FULL NAME *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Tunde Adebayo"
            placeholderTextColor="#94a3b8"
            value={customerName}
            onChangeText={setCustomerName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 08012345678"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Text style={styles.hintText}>Must be at least 10 digits for driver contact.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>DELIVERY ADDRESS *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="e.g. 14 University Road, Akoka, Lagos"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={2}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.fieldLabel}>LANDMARK OR AREA (OPTIONAL)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Near UNILAG 2nd Gate, behind St. Finbarrs"
            placeholderTextColor="#94a3b8"
            value={landmark}
            onChangeText={setLandmark}
          />
        </View>
      </View>

      {/* Purchase Type & Schedule Card */}
      <View style={styles.glassPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Purchase Type & Schedule</Text>
          <Text style={styles.panelSubtitle}>Choose between one-time batch or recurring supply</Text>
        </View>

        {/* Toggle Pills matching Web */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[
              styles.typePill,
              orderType === 'one_time' && styles.typePillActive,
            ]}
            onPress={() => setOrderType('one_time')}
          >
            <Text
              style={[
                styles.typePillText,
                orderType === 'one_time' && styles.typePillTextActive,
              ]}
            >
              One-time order
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typePill,
              orderType === 'subscription' && styles.typePillActive,
            ]}
            onPress={() => setOrderType('subscription')}
          >
            <Text
              style={[
                styles.typePillText,
                orderType === 'subscription' && styles.typePillTextActive,
              ]}
            >
              Subscribe
            </Text>
          </TouchableOpacity>
        </View>

        {orderType === 'one_time' ? (
          /* One-time Date Selection */
          <View style={styles.scheduleSection}>
            <Text style={styles.fieldLabel}>PREFERRED DELIVERY DATE (LAGOS TIME) *</Text>
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
                      isSelected && styles.datePillActive,
                    ]}
                    onPress={() => setSelectedDate(item.iso)}
                  >
                    <Text style={[styles.datePillDay, isSelected && styles.textWhite]}>
                      {dayName}
                    </Text>
                    <Text style={[styles.datePillNum, isSelected && styles.textWhite]}>
                      {d}
                    </Text>
                    <Text style={[styles.datePillMonth, isSelected && styles.textWhite]}>
                      {monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.scheduledNotice}>
              <Text style={styles.scheduledNoticeText}>
                📅 Selected: {formatReadableDate(selectedDate)}
              </Text>
            </View>
          </View>
        ) : (
          /* Subscription Frequency & Day Selection */
          <View style={styles.scheduleSection}>
            <Text style={styles.fieldLabel}>DELIVERY FREQUENCY *</Text>
            <View style={styles.freqRow}>
              <TouchableOpacity
                style={[
                  styles.freqCard,
                  frequency === 'weekly' && styles.freqCardActive,
                ]}
                onPress={() => setFrequency('weekly')}
              >
                <Text style={[styles.freqCardTitle, frequency === 'weekly' && styles.textPrimary]}>
                  Weekly
                </Text>
                <Text style={styles.freqCardDesc}>Every 7 days</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.freqCard,
                  frequency === 'monthly' && styles.freqCardActive,
                ]}
                onPress={() => setFrequency('monthly')}
              >
                <Text style={[styles.freqCardTitle, frequency === 'monthly' && styles.textPrimary]}>
                  Monthly
                </Text>
                <Text style={styles.freqCardDesc}>Every 4 weeks</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>PREFERRED DELIVERY DAY *</Text>
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((wd) => {
                const isSelected = selectedWeekday === wd.value;
                return (
                  <TouchableOpacity
                    key={wd.value}
                    style={[
                      styles.weekdayBtn,
                      isSelected && styles.weekdayBtnActive,
                    ]}
                    onPress={() => setSelectedWeekday(wd.value)}
                  >
                    <Text style={[styles.weekdayBtnText, isSelected && styles.textWhite]}>
                      {wd.label.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calcDateBox}>
              <Text style={styles.calcDateEyebrow}>CALCULATED FIRST DELIVERY</Text>
              <Text style={styles.calcDateValue}>
                {formatReadableDate(firstSubscriptionDate)}
              </Text>
              <Text style={styles.calcDateDesc}>
                First delivery is scheduled for the first occurrence of your chosen weekday at least 1 day after today (Lagos time).
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Order Summary & Demo Payment */}
      <View style={styles.glassPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>
            {orderType === 'subscription' ? 'Subscription Summary' : 'Order Summary'}
          </Text>
        </View>

        {/* Item Rows with Thumbnails matching Web */}
        <View style={styles.summaryList}>
          {items.map((i) => {
            const imageSource = getProductImage(i.product?.name || '');
            return (
              <View key={i.id} style={styles.summaryItem}>
                <View style={styles.summaryThumb}>
                  <Image source={imageSource} style={styles.summaryImg} resizeMode="contain" />
                </View>
                <View style={styles.summaryItemInfo}>
                  <Text style={styles.summaryItemTitle}>{i.product?.name || 'Water'}</Text>
                  <Text style={styles.summaryItemSub}>
                    {i.quantity} × {formatNaira(i.product?.price_ngn || 0)}
                  </Text>
                </View>
                <Text style={styles.summaryLineTotal}>
                  {formatNaira((i.product?.price_ngn || 0) * i.quantity)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {orderType === 'subscription' ? 'Per Delivery (NGN)' : 'Total (NGN)'}
          </Text>
          <Text style={styles.totalValue}>{formatNaira(totalAmount)}</Text>
        </View>

        {/* Demo Mode Notice matching Web */}
        <View style={styles.demoBox}>
          <View style={styles.demoBadge}>
            <View style={styles.demoGreenDot} />
            <Text style={styles.demoBadgeText}>Demo mode: no real payment is taken</Text>
          </View>
          <Text style={styles.demoDesc}>
            This is a test environment. No card number, expiration date, or CVV is required. Clicking the button below will record your order in Supabase.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.primaryGlossBtn, submitting && styles.btnDisabled]}
          activeOpacity={0.85}
          onPress={handlePlaceOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryGlossBtnText}>
              {orderType === 'subscription' ? 'Start subscription' : 'Place order'}
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
    backgroundColor: Colors.background, // #cae8ff sky water background
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  topBar: {
    marginBottom: -4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0061a5',
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
  panelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(186, 230, 253, 0.6)',
    paddingBottom: 10,
    gap: 2,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#001d35',
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#3f4753',
  },
  userEmailText: {
    color: '#0061a5',
    fontWeight: '700',
  },
  formGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#001d35',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#001d35',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  hintText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  typePill: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 12,
  },
  typePillActive: {
    backgroundColor: '#0099ff',
    ...Shadows.buttonGloss,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3f4753',
  },
  typePillTextActive: {
    color: '#ffffff',
  },
  scheduleSection: {
    gap: 8,
  },
  datesScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  datePill: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    alignItems: 'center',
    gap: 2,
  },
  datePillActive: {
    backgroundColor: '#0099ff',
    borderColor: '#0077d9',
    ...Shadows.buttonGloss,
  },
  datePillDay: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  datePillNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#001d35',
  },
  datePillMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  textWhite: {
    color: '#ffffff',
  },
  scheduledNotice: {
    backgroundColor: '#e1f3ff',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  scheduledNoticeText: {
    color: '#0061a5',
    fontSize: 13,
    fontWeight: '700',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 10,
  },
  freqCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
  },
  freqCardActive: {
    backgroundColor: '#e1f3ff',
    borderColor: '#0061a5',
  },
  freqCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#001d35',
  },
  freqCardDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  textPrimary: {
    color: '#0061a5',
  },
  weekdaysRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  weekdayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    alignItems: 'center',
  },
  weekdayBtnActive: {
    backgroundColor: '#0099ff',
    borderColor: '#0077d9',
  },
  weekdayBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3f4753',
  },
  calcDateBox: {
    marginTop: 8,
    backgroundColor: '#e1f3ff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 3,
  },
  calcDateEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0061a5',
    letterSpacing: 0.8,
  },
  calcDateValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#001d35',
  },
  calcDateDesc: {
    fontSize: 11,
    color: '#3f4753',
    lineHeight: 16,
  },
  summaryList: {
    gap: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
    overflow: 'hidden',
  },
  summaryImg: {
    width: '90%',
    height: '90%',
  },
  summaryItemInfo: {
    flex: 1,
  },
  summaryItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#001d35',
  },
  summaryItemSub: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryLineTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#001d35',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(186, 230, 253, 0.6)',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#001d35',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0061a5',
  },
  demoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#7dd3fc',
    gap: 6,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  demoGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  demoBadgeText: {
    color: '#065f46',
    fontSize: 11,
    fontWeight: '800',
  },
  demoDesc: {
    fontSize: 11,
    color: '#3f4753',
    lineHeight: 16,
  },
  primaryGlossBtn: {
    backgroundColor: '#0099ff',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    ...Shadows.buttonGloss,
  },
  primaryGlossBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
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
  stateIcon: {
    fontSize: 48,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#001d35',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#3f4753',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successIcon: {
    fontSize: 32,
    color: '#059669',
    fontWeight: '800',
  },
  refBadge: {
    backgroundColor: '#e1f3ff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  refBadgeText: {
    color: '#0061a5',
    fontSize: 12,
    fontWeight: '800',
  },
  confDetails: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  confRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  confLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  confValue: {
    fontSize: 12,
    color: '#001d35',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  confTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0061a5',
  },
  emailNoticeBox: {
    width: '100%',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
  },
  emailNoticeSuccess: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  emailNoticeWarning: {
    backgroundColor: '#fef3c7',
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
