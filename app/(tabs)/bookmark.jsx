import { FlatList, View, Text, Image, RefreshControl } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import VideoCard from '../../components/VideoCard';
import EmptyState from '../../components/EmptyState';
import { getBookmarkedPosts } from '../../lib/appwrite';
import useAppwrite from '../../lib/useAppwrite';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useGlobalContext } from '../../context/GlobalProvider';
import { icons } from '../../constants';

const Bookmark = () => {
  const { data: bookmarkedPosts, refetch } = useAppwrite(getBookmarkedPosts);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useGlobalContext();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={bookmarkedPosts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard 
            video={item} 
            onBookmarkChange={refetch}
          />
        )}
        ListHeaderComponent={() => (
          <View className="my-6 px-4 space-y-2">
            <View className="justify-between items-start flex-row mb-2">
              <View>
                <Text className="font-pmedium text-sm text-gray-100">Your Collection</Text>
                <Text className="text-2xl font-psemibold text-white">Saved Videos</Text>
                <Text className="text-gray-100 font-pregular text-sm mt-1">
                  {bookmarkedPosts?.length || 0} videos saved for later
                </Text>
              </View>
              <View className="mt-1.5">
                <Image
                  source={icons.bookmarkFilled}
                  className="w-9 h-10"
                  resizeMode="contain"
                  tintColor="#FFA001"
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No bookmarks yet"
            description="Videos you bookmark will appear here"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      />
    </SafeAreaView>
  );
};

export default Bookmark;
