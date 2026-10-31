import { Tabs } from "expo-router";
import { BodhiniTabBar } from "../../components/navigation/BodhiniTabBar";

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <BodhiniTabBar {...props} />} screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="documents" />
      <Tabs.Screen name="forms" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
