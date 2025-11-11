import { Stack, usePathname } from "expo-router";
import { StyleSheet, View } from "react-native";

import BottomNavigationBar from "@/components/BottomNavigationBar";

export default function AppLayout() {
  const pathname = usePathname();
  const hideNavBar = pathname?.includes('/support');

  console.log('Current pathname:', pathname, 'hideNavBar:', hideNavBar);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: styles.content,
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="transfer" />
        <Stack.Screen name="confirm-transfer" />
        <Stack.Screen name="mobile-recharge" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="profile-qr" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="history" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="contacts" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="automations" />
        <Stack.Screen name="envelopes" />
        <Stack.Screen name="charges" />
        <Stack.Screen
          name="support"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
            contentStyle: {
              backgroundColor: 'transparent',
            },
          }}
        />
      </Stack>
      {!hideNavBar && <BottomNavigationBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    backgroundColor: "transparent",
  },
});
