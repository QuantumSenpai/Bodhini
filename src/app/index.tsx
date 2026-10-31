import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 bg-cream items-center justify-center px-6">
      <Text className="text-4xl font-bold text-forest">
        Bodhini
      </Text>

      <Text className="text-base text-muted mt-3">
        Scan once. Fill any form.
      </Text>

      <View className="bg-forest rounded-2xl px-8 py-4 mt-8">
        <Text className="text-paper font-semibold">
          NativeWind is working!
        </Text>
      </View>
    </View>
  );
}