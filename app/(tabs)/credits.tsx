import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { InfoNote } from '@/components/InfoNote';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BuyCreditsFooter } from '@/features/credits/components/BuyCreditsFooter';
import { DummyStoreSheet } from '@/features/credits/components/DummyStoreSheet';
import { ItemsCalculator } from '@/features/credits/components/ItemsCalculator';
import { PackOption } from '@/features/credits/components/PackOption';
import { PurchaseResultNote } from '@/features/credits/components/PurchaseResultNote';
import { formatPesos } from '@/features/credits/creditCalculator';
import { BEST_VALUE_STORE_PRODUCT_ID, useBuyCredits } from '@/features/credits/hooks/useBuyCredits';
import { formatCredits } from '@/lib/creditUnits';
import { color, font, space } from '@/theme/theme';

/** Each phone names only its own store: the App Store does not accept an app that names another platform's. */
const PAID_THROUGH = Platform.OS === 'ios' ? 'Paid through the App Store. Needs internet.' : 'Paid through Google Play. Needs internet.';

/**
 * Buy credits (mockup 9): three packs from the server, the items → credits
 * calculator, and Buy. The balance links to Credit history. The purchase is
 * paid in the store and credited by the server; this screen only shows how it went.
 */
export default function BuyCreditsScreen() {
  const buy = useBuyCredits();
  const { chosen, purchase } = buy;
  const isReady = buy.productsStatus === 'ready';
  const isWorking = purchase.kind === 'working';
  const canBuy = isReady && chosen !== null && buy.store !== null;
  // The result note sits at the top of the page: bring it into view when a purchase ends.
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (purchase.kind !== 'idle' && purchase.kind !== 'working') scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [purchase.kind]);

  return (
    <Screen>
      <ScreenHeader eyebrow="CREDITS" title="Buy credits" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {buy.productsStatus === 'loading' && <ActivityIndicator style={styles.loading} color={color.primary} accessibilityLabel="Loading credit packs" />}
        {(buy.productsStatus === 'offline' || buy.productsStatus === 'error') && (
          <View style={styles.problem}>
            <EmptyState
              icon={buy.productsStatus === 'offline' ? 'wifi' : 'error'}
              title={buy.productsStatus === 'offline' ? "You're offline" : "Couldn't load the packs"}
              subtitle={buy.productsStatus === 'offline' ? 'Buying credits needs the internet. Nothing was bought. Connect and try again.' : 'Something went wrong on our side. Try again in a moment.'}
            />
            <Button label="Try again" variant="outline" onPress={buy.retryProducts} />
          </View>
        )}
        {isReady && (
          <>
            <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Pressable style={styles.balanceRow} onPress={() => router.push('/credits/history')} accessibilityRole="button" accessibilityLabel={`Balance ${buy.balanceUnits === null ? 'unknown' : formatCredits(buy.balanceUnits)} credits. Open credit history`}>
                <Text style={styles.balanceLabel}>BALANCE</Text>
                <Text style={styles.balanceAmount}>{buy.balanceUnits === null ? '–' : formatCredits(buy.balanceUnits)}</Text>
                <Text style={styles.historyLink}>History</Text>
                <Icon name="chevronRight" size={18} color={color.chevron} />
              </Pressable>
              <PurchaseResultNote purchase={purchase} balanceUnits={buy.balanceUnits} onCheckAgain={buy.checkAgain} onDismiss={buy.dismissResult} />
              <Text style={styles.intro}>One-time purchase. No monthly subscription. Credits are used each time you create an exam, retakes included.</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel="Credit packs" style={styles.packs}>
                {buy.products.map((product) => (
                  <PackOption
                    key={product.storeProductId}
                    product={product}
                    isPicked={product.storeProductId === buy.pickedId}
                    isBestValue={product.storeProductId === BEST_VALUE_STORE_PRODUCT_ID}
                    isDisabled={isWorking}
                    onPick={buy.pickProduct}
                  />
                ))}
              </View>
              <ItemsCalculator
                itemsText={buy.itemsText}
                creditsForItems={buy.creditsForItems}
                packCredits={chosen?.credits ?? null}
                itemsInPack={buy.itemsInChosenPack}
                onChangeItemsText={buy.changeItemsText}
                onStep={buy.stepItemsBy}
              />
              {buy.store === null && <InfoNote icon="info" text="Buying credits is not available in this version of the app yet." />}
            </ScrollView>
            <BuyCreditsFooter
              label={chosen ? `Buy ${chosen.credits.toLocaleString('en-US')} credits · ${formatPesos(chosen.priceCentavos)}` : 'Buy credits'}
              isBusy={isWorking}
              isDisabled={!canBuy}
              note={PAID_THROUGH}
              onPress={buy.buy}
            />
          </>
        )}
      </KeyboardAvoidingView>
      {buy.store?.kind === 'dummy' && <DummyStoreSheet />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { marginTop: 40 },
  problem: { flex: 1, paddingHorizontal: space.gutter, gap: 12, justifyContent: 'center' },
  content: { paddingHorizontal: space.gutter, paddingBottom: 16, gap: 14 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  balanceLabel: { fontFamily: font.eyebrow, fontSize: 11, letterSpacing: 1, color: color.inkMuted },
  balanceAmount: { flex: 1, fontFamily: font.monoStrong, fontSize: 20, color: color.ink },
  historyLink: { fontFamily: font.eyebrow, fontSize: 13, color: color.primary },
  intro: { fontFamily: font.uiRegular, fontSize: 14, lineHeight: 21, color: color.inkMuted },
  packs: { gap: 10 },
});
