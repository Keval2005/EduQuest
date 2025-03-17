import { StatusBar } from "expo-status-bar";
import {  Text, View } from "react-native";
import { Link } from "expo-router";
import { verifyInstallation } from 'nativewind';
import { NativeWindStyleSheet } from "nativewind";
import '../global.css';

export default function App() {
  
  // verifyInstallation();

  // NativeWindStyleSheet.setOutput({
  //   default: "native",
  // });

  return (
    <View className="flex-1 text-center justify-center items-center bg-gray-100">
      {/* <Text className="text-3xl">jati reje!!!!!!!!</Text>
      <Text className="text-3xl">jati reje!!!!!!!!</Text>
      <Text className="text-3xl">jati reje!!!!!!!!</Text>
      <Text className="text-3xl">jati reje!!!!!!!!</Text>
      <Text className="text-3xl">jati reje!!!!!!!!</Text> */}

        
        <Text className="text-3xl text-red-200">jati reje!!!!!!!!</Text>
        <Text className="text-3xl text-red-300">jati reje!!!!!!!!</Text>
        <Text className="text-3xl text-red-400">jati reje!!!!!!!!</Text>
        <Text className="text-3xl text-red-500">jati reje!!!!!!!!</Text>
      <StatusBar style="auto" />
      
      <Link href="/profile">Go to profile</Link>
      {/* <Link> is for going to one page to another */}

    </View>
  );
}

