import { StatusBar } from "expo-status-bar";
import {  Text, View } from "react-native";
import { SplashScreen,Link } from "expo-router";
import { verifyInstallation } from 'nativewind';
import { NativeWindStyleSheet } from "nativewind";
import { useFonts } from "expo-font";
import '../global.css';
import { use, useEffect } from "react";

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

        
        <Text className="text-3xl text-blue-500 font-pblack">jati reje!!!!!!!!</Text>
        <Text className="text-3xl text-red-300">jati reje!!!!!!!!</Text>
        <Text className="text-3xl text-red-400">jati reje!!!!!!!!</Text>
        <Text className="text-3xl text-red-500">jati reje!!!!!!!!</Text>
      <StatusBar style="auto" />
      
      <Link className="text-3xl  font-pblack" href="/profile">Go to profile</Link>
      {/* <Link> is for going to one page to another */}

    </View>
  );
}

