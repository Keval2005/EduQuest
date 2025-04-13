import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { icons } from '../constants'
import { Video, ResizeMode } from 'expo-av';

const VideoCard = ( {video: {title, thumbnail, video, creator:{ username, avatar }, $id }} ) => {
  const router = useRouter();

  const [play, setPlay] = useState(false);

  return (
    <View className="flex-col items-center px-4 mb-14">
      <View className="flex-row gap-3 items-start">
        <View className="justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center items-center">
            <Image source={{ uri:avatar }} className="w-full h-full rounded-lg" resizeMode='cover'/>
          </View>
          <View className="justify-center gap-y-1 flex-1 ml-3">
            <Text className="text-white font-psemibold text-lg" numberOfLines={1}>{title}</Text>
            <Text className="text-gray-100 font-pregular text-sm" numberOfLines={1}>{username}</Text>
          </View>
        </View>

        <View className="pt-2">
          <TouchableOpacity onPress={() => router.push(`/video/${$id}`)}>
            <Image source={icons.redirect} className="w-8 h-8" resizeMode='contain' />
          </TouchableOpacity>
        </View>
      </View>
      
      {play ? (
        <Video
          source={{ uri: video }}
          className="w-full h-60 rounded-xl mt-3"
          style={{
            width: "100%", // w-52 = 52 * 4
            height: 240, // h-72 = 60 * 4
            borderRadius: 12,
            marginTop: 12,
          }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) {
              setPlay(false);
            }
          }}
        />
      ) :(
        <TouchableOpacity 
          className="w-full h-60 rounded-xl mt-3 relative justify-center items-center" 
          activeOpacity={0.7}
          onPress={() => setPlay(true)}
        >
          <Image source={{ uri:thumbnail }} className="w-full h-full rounded-xl mt-3" resizeMode='cover'/>
          <Image source={icons.play} className="w-12 h-12 absolute" resizeMode='contain' />
        </TouchableOpacity> 
      )}
    </View>
  )
}

export default VideoCard