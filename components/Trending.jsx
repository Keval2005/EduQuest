import { useState, useRef } from "react";
import { ResizeMode, Video } from "expo-av";
import * as Animatable from "react-native-animatable";
import {
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { icons } from "../constants";

const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
};

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
};

const TrendingItem = ({ activeItem, item, isPlaying, onPlay, onEnd }) => {
  const videoRef = useRef(null);
  const router = useRouter();

  //const [play, setPlay] = useState(false);
  const handlePlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      onEnd(); // Notify parent when video finishes
    }
  };

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem === item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      {isPlaying ? (
        <View className="relative">
          <Video
            ref={videoRef}
            source={{ uri: item.video }}
            className="w-52 h-72 rounded-[33px] mt-3 bg-white/10"
            style={{
              width: 208,
              height: 288,
              borderRadius: 33,
              marginTop: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay={isPlaying}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          <TouchableOpacity
            className="absolute top-7 right-3 bg-black/50 rounded-full p-2"
            onPress={async () => {
              if (isPlaying && videoRef.current) {
                await videoRef.current.pauseAsync(); // Pause the video before redirecting
              }
              router.push(`/video/${item.$id}`);
            }}
          >
            <Image
              source={icons.redirect}
              className="w-7 h-7"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          className="relative flex justify-center items-center"
          activeOpacity={0.7}
          onPress={() => onPlay(item.$id)}
        >
          <ImageBackground
            source={{ uri: item.thumbnail }}
            className="w-52 h-72 rounded-[33px] my-5 overflow-hidden shadow-lg shadow-black/40"
            resizeMode="cover"
          />
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
          <TouchableOpacity
            className="absolute top-8 right-3 bg-black/50 rounded-full p-2"
            onPress={() => router.push(`/video/${item.$id}`)}
          >
            <Image
              source={icons.redirect}
              className="w-7 h-7"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

const Trending = ({ posts }) => {
  const [activeItem, setActiveItem] = useState(posts[0]?.$id);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  const handlePlay = (id) => {
    setCurrentPlayingId(prev => prev === id ? null : id);
    setActiveItem(id);
  };

  const handleVideoEnd = () => {
    setCurrentPlayingId(null);
  };

  const viewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].key);
    }
  };

  return (
    <FlatList
      data={posts}
      horizontal
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <TrendingItem 
          activeItem={activeItem} 
          item={item} 
          isPlaying={currentPlayingId === item.$id}
          onPlay={handlePlay}
          onEnd={handleVideoEnd}
        />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170 }}
    />
  );
};

export default Trending;