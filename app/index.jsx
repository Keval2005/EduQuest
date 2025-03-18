import { StatusBar } from "expo-status-bar";
import {  Text, View, ScrollView, Image } from "react-native";
import { SplashScreen,Link, Redirect, router } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";
// import { verifyInstallation } from 'nativewind';
// import { NativeWindStyleSheet } from "nativewind";
import '../global.css';
import { images } from "../constants";
import CustomButton from "../components/CustomButton";

export default function App() {
  
  // verifyInstallation();

  // NativeWindStyleSheet.setOutput({
  //   default: "native",
  // });

  

  return (
    
    <SafeAreaView className="bg-primary h-full">  
    {/* SafeAreaView is used to make sure that the content is not hidden by the status bar or the bottom bar */}
      <ScrollView contentContainerStyle={{height: '100%'}}>
        <View className="w-full min-h-[85vh] justify-center items-center px-4">
          <Image
            source={images.logo}
            className="w-[140px] h-[84px]"
            resizeMode="contain"
            />

          <Image
            source={images.cards}
            className="max-w-[380px] w-full h-[300px]"
            resizeMode="contain"
            />
          <View className="relative mt-5">
          
          <Text className="text-3xl text-white font-bold text-center">
            Discover Endless {'\n'} Possibilities with {''}
            <Text className="text-secondary-200">Aora</Text>
          </Text>

          <Image source={images.path} className=" w-[136px] h-[15px] absolute -bottom-3 -right-11" resizeMode="contain" />
          </View>

          <Text className="text-sm text-gray-100 text-center mt-7 font-pregular">
            Where Creativity meets Innovation: embark on a journey of endless possibilities with Aora
          </Text>

          <CustomButton 
            title='Continue with email' 
            handlePress={ ()=> router.push('/sign-in')}
            containerStyles="w-full mt-7"
          />
        </View>
      </ScrollView>
      <StatusBar style='light' backgroundColor="#161622" />
    </SafeAreaView>

    // <View className="flex-1 text-center justify-center items-center bg-gray-100">
       
    //     <Text className="text-3xl text-blue-500 font-pblack">jati reje!!!!!!!!</Text>
    //     <Text className="text-3xl text-red-400">jati reje!!!!!!!!</Text>
    //     <Text className="text-3xl text-red-500">jati reje!!!!!!!!</Text>
    //   <StatusBar style="auto" />
      
    //   <Link className="text-3xl  font-pblack" href="/home">Go to profile</Link>
    //   {/* <Link> is for going to one page to another */}

    // </View>
  );
}

