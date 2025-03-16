import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

export default function App() {
  return (
    <View style={styles.container}>
      <Text>jati reje!!!!!!!!</Text>
      <StatusBar style="auto" />
      
      <Link href="/profile">Go to profile</Link>
      {/* <Link> is for going to one page to another */}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});