import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { icons } from '../constants'

const VideoCard = ( {video: {title, thumbnail, video, creator:{ username, avatar }, $id }} ) => {
  const router = useRouter();

  return (
    <View className="flex-col items-center px-4 mb-14">
      <View className="flex-row gap-3 items-start">
        <View className="justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center items-center">
            <Image source={{ uri:avatar }} className="w-full h-full rounded-lg" resizeMode='cover'/>
          </View>
          <View className="justify-center gap-y-1 flex-1 ml-3">
            <Text className="text-white font-psemibold text-sm" numberOfLines={1}>{title}</Text>
            <Text className="text-gray-100 font-pregular text-xs" numberOfLines={1}>{username}</Text>
          </View>
        </View>

        <View className="pt-2">
          <Image source={icons.menu} className="w-5 h-5" resizeMode='contain' />
        </View>
      </View>
      
      <TouchableOpacity 
        className="w-full h-60 rounded-xl mt-3 relative justify-center items-center" 
        activeOpacity={0.7}
        onPress={() => router.push(`/video/${$id}`)}
      >
        <Image source={{ uri:thumbnail }} className="w-full h-full rounded-xl mt-3" resizeMode='cover'/>
        <Image source={icons.play} className="w-12 h-12 absolute" resizeMode='contain' />
      </TouchableOpacity> 
    </View>
  )
}

export default VideoCard